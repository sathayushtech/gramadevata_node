import { BadRequestException, UnauthorizedException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import * as jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { CreationAttributes, Op } from 'sequelize';
import { Register as User } from './user.model';
import { UserStatus } from '../../common/enums/user-status.enum';

const ADMIN_USERNAMES = new Set(["sathayushtechsolutions@gmail.com", "7680822565"]);
const OTP_EXPIRY_HOURS = 24;

type VerifyOtpResponse = {
  refresh: string;
  access: string;
  username: string;
  user_id: number;
  is_member: boolean;
  type: string | null;
  profile_pic: string | null;
  full_name: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly configService: ConfigService
  ) {}

  async requestOtp(payload: Record<string, unknown>): Promise<{ message: string }> {
    const username = typeof payload.username === 'string' ? payload.username.trim() : '';

    if (!username) {
      throw new BadRequestException('username is required');
    }

    const otp = ADMIN_USERNAMES.has(username) ? '0000' : this.generateOtp();

    let user = await this.userModel.findOne({
      where: {
        [Op.or]: [{ email: username }, { contactNumber: username }],
      },
    });

    if (user) {
      user.verificationOtp = otp;
      user.verificationOtpCreatedTime = new Date();
      await user.save();
    } else {
      const isEmailUsername = this.isEmail(username);
      const createPayload = {
        username,
        verificationOtp: otp,
        verificationOtpCreatedTime: new Date(),
        ...(isEmailUsername ? { email: username } : { contactNumber: username }),
      } as CreationAttributes<User>;

      user = await this.userModel.create(createPayload);
    }

    if (this.isEmail(username)) {
      this.runAsync(() => this.sendEmail(username, otp));
    } else {
      this.runAsync(() => this.sendSms(username, otp));
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(payload: Record<string, unknown>): Promise<VerifyOtpResponse> {
    const username = typeof payload.username === 'string' ? payload.username.trim() : '';
    const verificationOtp = typeof payload.verification_otp === 'string' ? payload.verification_otp.trim() : '';

    if (!username || !verificationOtp) {
      throw new BadRequestException('username and verification_otp are required');
    }

    const user = await this.userModel.findOne({
      where: {
        verificationOtp,
        [Op.or]: [{ email: username }, { contactNumber: username }],
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid OTP');
    }

    if (ADMIN_USERNAMES.has(username) && verificationOtp !== '0000') {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.verificationOtpCreatedTime) {
      throw new BadRequestException('OTP expired');
    }

    const expiresAt = new Date(user.verificationOtpCreatedTime.getTime() + OTP_EXPIRY_HOURS * 60 * 60 * 1000);
    if (expiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const wasInactive = user.status !== UserStatus.ACTIVE;
    user.status = UserStatus.ACTIVE;
    await user.save();

    const welcomeEmail = user.email;
    if (wasInactive && welcomeEmail) {
      this.runAsync(() => this.sendWelcomeEmail(welcomeEmail));
    }

    const profilePic = this.resolveProfilePic(user.profilePic);
    const tokens = this.buildTokens(user);

    return {
      refresh: tokens.refresh,
      access: tokens.access,
      username: user.username ?? '',
      user_id: Number(user.id),
      is_member: user.isMember?.toLowerCase() === 'true',
      type: user.type ?? null,
      profile_pic: profilePic,
      full_name: user.fullName ?? null,
    };
  }

  async getAdminProfileById(id: string): Promise<Record<string, unknown> | null> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      return null;
    }

    return this.toAdminProfileResponse(user);
  }

  async ssoLogin(token?: string): Promise<Record<string, unknown>> {
    if (!token) {
      throw new BadRequestException('Token missing');
    }

    const secret = this.configService.get<string>('SSO_JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    try {
      const payload = jwt.verify(token, secret) as Record<string, unknown>;
      const rawUserId = payload.user_id ?? payload.id;
      const userId = typeof rawUserId === 'number'
        ? String(rawUserId)
        : typeof rawUserId === 'string'
          ? rawUserId
          : undefined;
      const username = typeof payload.username === 'string' ? payload.username : undefined;
      const email = typeof payload.email === 'string' ? payload.email : undefined;
      const contactNumber = typeof payload.contact_number === 'string'
        ? payload.contact_number
        : typeof payload.contactNumber === 'string'
          ? payload.contactNumber
          : undefined;

      if (!userId) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      let user = await this.userModel.findByPk(userId);

      if (!user) {
        const safeUsername = username || email || contactNumber || userId;
        const createPayload: CreationAttributes<User> = {
          id: userId,
          username: safeUsername,
          ...(email ? { email } : {}),
          ...(contactNumber ? { contactNumber } : {}),
          status: UserStatus.ACTIVE,
        } as CreationAttributes<User>;

        user = await this.userModel.create(createPayload);
      }

      const tokens = this.buildTokens(user);

      return {
        refresh: tokens.refresh,
        access: tokens.access,
        message: 'SSO Login Success',
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async refreshToken(payload: Record<string, unknown>): Promise<Record<string, string>> {
    const refresh = typeof payload.refresh === 'string' ? payload.refresh.trim() : '';
    if (!refresh) {
      throw new BadRequestException('refresh is required');
    }

    const secret = this.configService.get<string>('JWT_SECRET') || 'change-me';

    try {
      const decoded = jwt.verify(refresh, secret) as Record<string, unknown>;
      const accessPayload = {
        user_id: decoded.user_id,
        username: decoded.username,
        email: decoded.email,
        contact_number: decoded.contact_number,
        source: decoded.source ?? 'gramadevata',
      };

      const access = jwt.sign(accessPayload, secret, { expiresIn: '1h' });
      return { access };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private generateOtp(length = 4) {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += digits[Math.floor(Math.random() * digits.length)];
    }
    return result;
  }

  private isEmail(value: string) {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(value);
  }

  private resolveProfilePic(profilePic?: string) {
    if (!profilePic) {
      return null;
    }

    const fileUrl = this.configService.get<string>('FILE_URL');
    if (!fileUrl) {
      return profilePic;
    }

    const trimmed = fileUrl.endsWith('/') ? fileUrl.slice(0, -1) : fileUrl;
    return `${trimmed}/${profilePic}`;
  }

  private toAdminProfileResponse(user: User): Record<string, unknown> {
    const plain = user.get({ plain: true }) as User & {
      profilePic?: string;
      familyImages?: unknown;
      pujariCertificate?: unknown;
      pujariIdImage?: string;
      pujariVideo?: unknown;
    };

    const profilePic = this.resolveFilePath(plain.profilePic ?? null);
    const familyImages = this.resolveFileList(plain.familyImages);
    const pujariCertificate = this.resolveFileList(plain.pujariCertificate);
    const pujariIdImage = this.resolveFilePath(plain.pujariIdImage ?? null);
    const pujariVideo = this.resolveFileList(plain.pujariVideo);

    return {
      temples_count: 0,
      id: plain.id,
      full_name: plain.fullName ?? null,
      surname: plain.surname ?? null,
      gotram: plain.gotram ?? null,
      father_name: plain.fatherName ?? null,
      profile_pic: profilePic,
      contact_number: plain.contactNumber ?? null,
      gender: plain.gender ?? null,
      dob: plain.dob ?? null,
      type: plain.type ?? null,
      pujari_certificate: pujariCertificate,
      working_temple: plain.workingTemple ?? null,
      is_member: plain.isMember ?? null,
      Connections: [],
      temples: [],
      goshalas: [],
      events: [],
      family_images: familyImages,
      email: plain.email ?? null,
      account_type: plain.accountType ?? null,
      mother_name: plain.motherName ?? null,
      paternal_grandmother_name: plain.paternalGrandmotherName ?? null,
      paternal_grandfather_name: plain.paternalGrandfatherName ?? null,
      paternal_great_grandfather_name: plain.paternalGreatGrandfatherName ?? null,
      paternal_great_grandmother_name: plain.paternalGreatGrandmotherName ?? null,
      paternal_grandmother_father_name: plain.paternalGrandmotherFatherName ?? null,
      paternal_grandmother_mother_name: plain.paternalGrandmotherMotherName ?? null,
      maternal_grandfather_name: plain.maternalGrandfatherName ?? null,
      maternal_grandmother_name: plain.maternalGrandmotherName ?? null,
      maternal_great_grandfather_name: plain.maternalGreatGrandfatherName ?? null,
      maternal_great_grandmother_name: plain.maternalGreatGrandmotherName ?? null,
      maternal_grandmother_father_name: plain.maternalGrandmotherFatherName ?? null,
      maternal_grandmother_mother_name: plain.maternalGrandmotherMotherName ?? null,
      marital_status: plain.maritalStatus ?? null,
      wife: plain.wife ?? null,
      husband: plain.husband ?? null,
      children: plain.children ?? null,
      siblings: plain.siblings ?? null,
      favorite: [],
      voluntary_level: plain.voluntaryLevel ?? null,
      pujari_expertise: plain.pujariExpertise ?? null,
      pujari_id_type: plain.pujariIdType ?? null,
      pujari_certificate_type: plain.pujariCertificateType ?? null,
      pujari_id_image: pujariIdImage,
      pujari_category: [],
      pujari_sub_category: [],
      issued_by: plain.issuedBy ?? null,
      pujari_type: plain.pujariType ?? null,
      pujari_video: pujariVideo,
      pujari_category_detail: [],
      pujari_sub_category_detail: [],
      pujari_designation: plain.pujariDesignation ?? null,
      visit_temples: [],
    };
  }

  private resolveFilePath(pathValue: string | null) {
    if (!pathValue) {
      return null;
    }

    const base = this.configService.get<string>('FILE_URL')
      || this.configService.get<string>('File_path')
      || '';
    if (!base) {
      return pathValue;
    }

    const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleaned = pathValue.startsWith('/') ? pathValue.slice(1) : pathValue;
    return `${trimmed}/${cleaned}`;
  }

  private resolveFileList(value: unknown): string[] {
    if (!value) {
      return [];
    }

    const items = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.replace(/[\[\]]/g, '').split(',')
        : [value];

    return items
      .map((item) => String(item).replace(/['"]+/g, '').trim())
      .filter(Boolean)
      .map((item) => this.resolveFilePath(item) || item)
      .filter((item): item is string => Boolean(item));
  }

  private buildTokens(user: User) {
    const secret =
      this.configService.get<string>('JWT_SECRET') ||
      this.configService.get<string>('SSO_JWT_SECRET') ||
      'change-me';
    const payload = {
      user_id: user.id,
      username: user.username,
      email: user.email,
      contact_number: user.contactNumber,
      source: 'gramadevata',
    };

    const access = jwt.sign(payload, secret, { expiresIn: '1h' });
    const refresh = jwt.sign(payload, secret, { expiresIn: '7d' });

    return { access, refresh };
  }

  private runAsync(task: () => Promise<void> | void) {
    setImmediate(() => {
      void Promise.resolve(task());
    });
  }

  private getMailTransport() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') || 465);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  private async sendEmail(email: string, otp: string) {
    const transport = this.getMailTransport();
    if (!transport) {
      console.log(`Email OTP to ${email}: ${otp}`);
      return;
    }

    const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER') || '';
    const subject = 'Your GRAMADEVATA account verification email';
    const message = `Your OTP is ${otp}`;

    await transport.sendMail({
      from,
      to: email,
      subject,
      text: message,
    });
  }

  private async sendWelcomeEmail(email: string) {
    const transport = this.getMailTransport();
    if (!transport) {
      console.log(`Welcome email to ${email}`);
      return;
    }

    const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER') || '';
    const subject = 'Welcome to Gramadevata';
    const html = `
      <html>
      <head>
        <title>Welcome to Gramadevata</title>
      </head>
      <body>
        <p>Dear ${email},</p>
        <p>Namaskaram Welcome to Gramadevata Foundation,</p>
        <p>Thank you(dhanyavad) for joining Gramadevata web-app social networking platform. We are pleased to have you as a member of our community. we look forward to your valuable contributions as a part of our mission to bring people together in our community. Your support allow us to continue fulfil our mission and serve Hindu society.</p>
        <p>Please feel free to share the information about your village-area, temple, goshala and events by uploading in Gramadevata web-app platform</p>
        <p>If you have any queries or require assistance, please feel free to contact our moderation team infogd@sathayushtech.com</p>
        <p>Best Regards,<p>
        <p>Gramadevata Foundation</p>
      </body>
      </html>
    `;

    await transport.sendMail({
      from,
      to: email,
      subject,
      html,
      text: 'Welcome to Gramadevata',
    });
  }

  private async sendSms(username: string, otp: string) {
    const smsUser = this.configService.get<string>('SMS_USER');
    const smsPassword = this.configService.get<string>('SMS_PASSWORD');
    const smsSender = this.configService.get<string>('SMS_SENDER');
    const smsType = this.configService.get<string>('SMS_TYPE');
    const smsTemplateId = this.configService.get<string>('SMS_TEMPLATE_ID');

    if (!smsUser || !smsPassword || !smsSender || !smsType || !smsTemplateId) {
      console.log(`SMS OTP to ${username}: ${otp}`);
      return;
    }

    const message = `Dear user your OTP to verify your Gramadevata User account is ${otp}. Thank You! team Sathayush.`;
    const url = `http://api.bulksmsgateway.in/sendmessage.php?user=${smsUser}&password=${smsPassword}&mobile=${username}&message=${encodeURIComponent(message)}&sender=${smsSender}&type=${smsType}&template_id=${smsTemplateId}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`SMS send failed: ${response.status}`);
      }
    } catch (error) {
      console.log('SMS send error', error);
    }
  }
}
