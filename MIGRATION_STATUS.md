# Gramadevata: Django → Node.js Migration Status

*Last updated: 9 March 2026*

## Summary

| Metric | Count | Percentage |
|---|---|---|
| **Total Django Endpoints** | 463 | 100% |
| **Migrated to Node.js** | 441 | 95.2% |
| **Pending** | 22 | 4.8% |

---

## ✅ MIGRATED — Django Endpoints Available in Node.js (441)

### Auth (4 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| POST | /register | /gramadevata/register | ✅ |
| POST | /verify | /gramadevata/verify | ✅ |
| GET | /admin_profile_get_by_id/{id}/ | /gramadevata/admin_profile_get_by_id/{id} | ✅ |
| GET | /country | /gramadevata/country | ✅ |

### Comments (6 of 7 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| GET | /comment | /gramadevata/comments | ✅ |
| POST | /comment | /gramadevata/comments | ✅ |
| GET | /comment/{_id} | /gramadevata/comments/{id} | ✅ |
| PUT | /comment/{_id} | /gramadevata/comments/{id} | ✅ |
| DELETE | /comment/{_id} | /gramadevata/comments/{id} | ✅ |
| POST | /comment/{_id}/mark_as_inactive | /gramadevata/comments/{id}/mark-as-inactive | ✅ |

### Temple (69 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| GET | /temple | /gramadevata/temple | ✅ |
| POST | /temple | /gramadevata/temple | ✅ |
| GET | /temple/{_id} | /gramadevata/temple/{id} | ✅ |
| PUT | /temple/{_id} | /gramadevata/temple/{id} | ✅ |
| PATCH | /temple/{_id} | /gramadevata/temple/{id} | ✅ |
| DELETE | /temple/{_id} | /gramadevata/temple/{id} | ✅ |
| GET | /templeCategeory (CRUD 6) | /gramadevata/templeCategeory | ✅ |
| GET | /temple_main_category (CRUD 6) | /gramadevata/temple_main_category | ✅ |
| GET | /templepriority (CRUD 6) | /gramadevata/templepriority | ✅ |
| GET | /temple_facilities (CRUD 6) | /gramadevata/temple_facilities | ✅ |
| GET | /temple-nearby-hotels (CRUD 6) | /gramadevata/temple-nearby-hotels | ✅ |
| GET | /temple-transports (CRUD 6) | /gramadevata/temple-transports | ✅ |
| GET | /temple_pooja_timings (CRUD 6) | /gramadevata/temple_pooja_timings | ✅ |
| GET | /add_more_temple_details (CRUD 6) | /gramadevata/add_more_temple_details | ✅ |
| GET | /api/temples/ | /gramadevata/api/temples | ✅ |
| GET | /visit_temples (CRUD 6) | /gramadevata/visit_temples | ✅ |
| GET | /favorite-temples (CRUD 6) | /gramadevata/favorite-temples | ✅ |
| GET | /citytemples_bylocation | /gramadevata/citytemples_bylocation | ✅ |
| GET | /globaltemples | /gramadevata/globaltemples | ✅ |
| GET | /locationByTemples/ | /gramadevata/locationByTemples | ✅ |
| GET | /InactivelocationByTemples | /gramadevata/InactivelocationByTemples | ✅ |
| GET | /hotels_by_location | /gramadevata/hotels_by_location | ✅ |
| GET | /social_activities (CRUD 6) | /gramadevata/social_activities | ✅ |
| GET | /prayers_and_benefits (CRUD 6) | /gramadevata/prayers_and_benefits | ✅ |
| GET | /temple_inactive | /gramadevata/temple_inactive | ✅ |
| GET | /temple_inactive_get/{field_name}/{input_value} | /gramadevata/temple_inactive_get/{fn}/{iv} | ✅ |
| GET | /templedetail/{_id}/ | /gramadevata/templedetail/{id} | ✅ |
| GET | /templeget/{field_name}/{input_value} | /gramadevata/templeget/{fn}/{iv} | ✅ |
| GET | /templemain | /gramadevata/templemain | ✅ |
| PUT | /templemerge/{temple_id}/ | /gramadevata/templemerge/{temple_id} | ✅ |
| POST | /templepost | /gramadevata/templepost | ✅ |
| PUT | /temple_hotel_merge/{hotel_id} | /gramadevata/temple_hotel_merge/{hotel_id} | ✅ |
| GET | /temples/block_id/{block_id}/ | /gramadevata/temples/block_id/{block_id} | ✅ |
| GET | /temples/country_id/{country_id}/ | /gramadevata/temples/country_id/{country_id} | ✅ |
| GET | /temples/district_id/{district_id}/ | /gramadevata/temples/district_id/{district_id} | ✅ |
| GET | /temples/state_id/{state_id}/ | /gramadevata/temples/state_id/{state_id} | ✅ |
| GET | /statetemples_bylocation | /gramadevata/statetemples_bylocation | ✅ |
| GET | /towntemples_bylocation | /gramadevata/towntemples_bylocation | ✅ |
| GET | /indiatemples | /gramadevata/indiatemples | ✅ |

### Events (27 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| GET | /event (CRUD 6) | /gramadevata/event | ✅ |
| GET | /eventcategory (CRUD 6) | /gramadevata/eventcategory | ✅ |
| GET | /add_more_event_details (CRUD 6) | /gramadevata/add_more_event_details | ✅ |
| PUT | /eventmerge/{event_id} | /gramadevata/eventmerge/{event_id} | ✅ |
| POST | /eventpost | /gramadevata/eventpost | ✅ |
| GET | /eventsmain | /gramadevata/eventsmain | ✅ |
| GET | /eventsstatus | /gramadevata/eventsstatus | ✅ |
| GET | /events_inactive | /gramadevata/events_inactive | ✅ |
| GET | /events_inactive_get/{fn}/{iv} | /gramadevata/events_inactive_get/{fn}/{iv} | ✅ |
| GET | /globalevents | /gramadevata/globalevents | ✅ |
| GET | /Events/state_id/{state_id} | /gramadevata/Events/state_id/{state_id} | ✅ |
| GET | /Events/district_id/{district_id} | /gramadevata/Events/district_id/{district_id} | ✅ |
| GET | /Events/block_id/{block_id} | /gramadevata/Events/block_id/{block_id} | ✅ |

### Goshala (29 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| GET | /goshala (CRUD 6) | /gramadevata/goshala | ✅ |
| GET | /goshalacategories (CRUD 6) | /gramadevata/goshalacategories | ✅ |
| GET | /add_more_goshala_details (CRUD 6) | /gramadevata/add_more_goshala_details | ✅ |
| GET | /goshalamain | /gramadevata/goshalamain | ✅ |
| POST | /goshalapost | /gramadevata/goshalapost | ✅ |
| PUT | /goshalamerge/{goshala_id} | /gramadevata/goshalamerge/{goshala_id} | ✅ |
| GET | /goshala_inactive | /gramadevata/goshala_inactive | ✅ |
| GET | /goshala_inactive_get/{fn}/{iv} | /gramadevata/goshala_inactive_get/{fn}/{iv} | ✅ |
| GET | /globalgoshala | /gramadevata/globalgoshala | ✅ |
| GET | /goshalas/state_id/{state_id} | /gramadevata/goshalas/state_id/{state_id} | ✅ |
| GET | /goshalas/district_id/{district_id} | /gramadevata/goshalas/district_id/{district_id} | ✅ |
| GET | /goshalas/block_id/{block_id} | /gramadevata/goshalas/block_id/{block_id} | ✅ |

### Village (79 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| GET | /village (CRUD 6) | /gramadevata/village | ✅ |
| GET | /village_geographic (CRUD 6) | /gramadevata/village_geographic | ✅ |
| GET | /village-famous-personalities (CRUD 6) | /gramadevata/village-famous-personalities | ✅ |
| GET | /village-development-facilities (CRUD 6) | /gramadevata/village-development-facilities | ✅ |
| GET | /village_school (CRUD 6) | /gramadevata/village_school | ✅ |
| GET | /village-bank (CRUD 6) | /gramadevata/village-bank | ✅ |
| GET | /village-college (CRUD 6) | /gramadevata/village-college | ✅ |
| GET | /village-cultural-profile (CRUD 6) | /gramadevata/village-cultural-profile | ✅ |
| GET | /village-artists (CRUD 6) | /gramadevata/village-artists | ✅ |
| GET | /village-market (CRUD 6) | /gramadevata/village-market | ✅ |
| GET | /village-postoffice (CRUD 6) | /gramadevata/village-postoffice | ✅ |
| GET | /village-sportsground (CRUD 6) | /gramadevata/village-sportsground | ✅ |
| GET | /add_more_village_details (CRUD 6) | /gramadevata/add_more_village_details | ✅ |
| GET | /search_village/ | /gramadevata/search_village | ✅ |
| GET | /village_inactive | /gramadevata/village_inactive | ✅ |
| GET | /village_inactive_get/{fn}/{iv}/ | /gramadevata/village_inactive_get/{fn}/{iv} | ✅ |

### Tourism (28 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| GET | /tourism (CRUD 6) | /gramadevata/tourism | ✅ |
| GET | /tour-operators (CRUD 6) | /gramadevata/tour-operators | ✅ |
| GET | /tour_guides (CRUD 6) | /gramadevata/tour_guides | ✅ |
| GET | /add_more_tour-operators (CRUD 6) | /gramadevata/add_more_tour-operators | ✅ |
| GET | /tourism_bylocation | /gramadevata/tourism_bylocation | ✅ |
| GET | /inactive_tourism_bylocation | /gramadevata/inactive_tourism_bylocation | ✅ |
| GET | /tourism_inactive | /gramadevata/tourism_inactive | ✅ |
| GET | /tour-operators_by_location | /gramadevata/tour-operators_by_location | ✅ |
| GET | /tour_guides_by_location | /gramadevata/tour_guides_by_location | ✅ |
| PUT | /tour_operator_merge/{operator_id} | /gramadevata/tour_operator_merge/{operator_id} | ✅ |

### Accommodation (6 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| — | /accommodation (CRUD 6) | /gramadevata/accommodation | ✅ |

### Welfare (19 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| — | /welfare_home (CRUD 6) | /gramadevata/welfare_home | ✅ |
| — | /welfare_homes_category (CRUD 6) | /gramadevata/welfare_homes_category | ✅ |
| GET | /welfare-homes_by-location | /gramadevata/welfare-homes_by-location | ✅ |
| GET | /inactive_welfare_homes_by_location | /gramadevata/inactive_welfare_homes_by_location | ✅ |
| GET | /welfarehomes_inactive | /gramadevata/welfarehomes_inactive | ✅ |

### Hospital / Veterinary (25 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| — | /nearby_hospitals (CRUD 6) | /gramadevata/nearby_hospitals | ✅ |
| — | /veterinary_hospital (CRUD 6) | /gramadevata/veterinary_hospital | ✅ |
| — | /add_more_hospital (CRUD 6) | /gramadevata/add_more_hospital | ✅ |
| — | /add_more_veterinary_hospital (CRUD 6) | /gramadevata/add_more_veterinary_hospital | ✅ |
| GET | /veterinary_hospitals_by_location | /gramadevata/veterinary_hospitals_by_location | ✅ |
| PUT | /veterinary_hospital_merge/{operator_id} | /gramadevata/veterinary_hospital_merge/{operator_id} | ✅ |

### Hotel (12 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| — | /add_more_hotel (CRUD 6) | /gramadevata/add_more_hotel | ✅ |

*(Note: hotel CRUD itself is under temple-nearby-hotels, counted in Temple section above)*

### Restaurant (12 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| — | /restaurants (CRUD 6) | /gramadevata/restaurants | ✅ |
| — | /add_more_restaurants (CRUD 6) | /gramadevata/add_more_restaurants | ✅ |

### Pooja Store (12 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| — | /pooja_stores (CRUD 6) | /gramadevata/pooja_stores | ✅ |
| — | /add_more_pooja_store (CRUD 6) | /gramadevata/add_more_pooja_store | ✅ |

### Blood Bank (13 of 14 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| GET | /blood_bank | /gramadevata/blood_bank | ✅ |
| POST | /blood_bank | /gramadevata/blood_bank | ✅ |
| GET | /blood_bank/{_id} | /gramadevata/blood_bank/{id} | ✅ |
| PUT | /blood_bank/{_id} | /gramadevata/blood_bank/{id} | ✅ |
| DELETE | /blood_bank/{_id} | /gramadevata/blood_bank/{id} | ✅ |
| GET | /blood_banks_by_location | /gramadevata/blood_banks_by_location | ✅ |
| PUT | /bloodbank_merge/{blood_bank_id} | /gramadevata/bloodbank_merge/{blood_bank_id} | ✅ |
| — | /add_more_blood_bank (CRUD 6) | /gramadevata/add_more_blood_bank | ✅ |

### Other Modules (miscellaneous migrated)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| — | /ambulance_facility (CRUD 6) | /gramadevata/ambulance_facility | ✅ |
| — | /block (CRUD 6) | /gramadevata/block | ✅ |
| — | /district (CRUD 6) | /gramadevata/district | ✅ |
| — | /state (CRUD 6) | /gramadevata/state | ✅ |
| — | /chat (CRUD 6) | /gramadevata/chat | ✅ |
| — | /connect (CRUD 6) | /gramadevata/connect | ✅ |
| — | /fire_station (CRUD 6) | /gramadevata/fire_station | ✅ |
| — | /police_station (CRUD 6) | /gramadevata/police_station | ✅ |
| — | /media (CRUD 6) | /gramadevata/media | ✅ |
| — | /pujari_category (CRUD 6) | /gramadevata/pujari_category | ✅ |
| — | /pujari-subcategories (CRUD 6) | /gramadevata/pujari-subcategories | ✅ |
| GET | /global_search | /gramadevata/global_search | ✅ |
| DELETE | /delete-member/{id}/ | /gramadevata/delete-member/{id} | ✅ |
| DELETE | /delete-pujari/{id}/ | /gramadevata/delete-pujari/{id} | ✅ |
| POST | /deleteimage/{id} | /gramadevata/deleteimage/{id} | ✅ |

### Profile Management (6 endpoints)
| Method | Django Endpoint | Node.js Endpoint | Status |
|--------|----------------|------------------|--------|
| PUT | /profile/{id} | /gramadevata/profile/{id} | ✅ |
| DELETE | /profile_delete/{id}/ | /gramadevata/profile_delete/{id} | ✅ |
| GET | /profile_get/ | /gramadevata/profile_get | ✅ |
| GET | /profile_get_by_id/{id}/ | /gramadevata/profile_get_by_id/{id} | ✅ |
| PUT | /profileimages/{id} | /gramadevata/profileimages/{id} | ✅ |
| PUT | /updateroots/{id} | /gramadevata/updateroots/{id} | ✅ |

---

## ❌ PENDING — Django Endpoints NOT Yet in Node.js (22)

### 1. Auth / SSO / Token (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /sso_login | ❌ Pending |
| POST | /token/refresh | ❌ Pending |

### 2. Events — Missing Endpoints (3 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /InactivelocationByEvents | ❌ Pending |
| GET | /locationByEvents/ | ❌ Pending |
| GET | /indiaevents | ❌ Pending |

### 3. Goshala — Missing Endpoints (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /InactivelocationByGoshalas | ❌ Pending |
| GET | /locationByGoshalas/ | ❌ Pending |

### 4. Village — Missing Endpoints (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /villages_by_location | ❌ Pending |
| PUT | /mergevillage/{village_id}/ | ❌ Pending |

### 5. Blood Bank — Missing Endpoint (1 endpoint)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| PATCH | /blood_bank/{_id} | ❌ Pending |

### 6. Comment — Missing Endpoint (1 endpoint)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| PATCH | /comment/{_id} | ❌ Pending |

### 7. Country — Missing Endpoint (1 endpoint)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /country/{_id} | ❌ Pending |

### 8. Hospital — Missing Endpoints (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /hospitals_by_location | ❌ Pending |
| PUT | /nearby_hospital_merge/{hospital_id} | ❌ Pending |

### 9. Restaurant — Missing Endpoints (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /restaurants_by_location | ❌ Pending |
| PUT | /restaurant_merge/{restaurant_id} | ❌ Pending |

### 10. Pooja Store — Missing Endpoints (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /pooja_stores_by_location | ❌ Pending |
| PUT | /pooja_store_merge/{pooja_store_id} | ❌ Pending |

### 11. Share (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /share/temple/{id}/ | ❌ Pending |
| GET | /share/{content_type}/{content_id}/ | ❌ Pending |

### 12. Home (1 endpoint)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /home | ❌ Pending |

---

## 🆕 Node.js-Only Endpoints (not in Django)

| Method | Node.js Endpoint | Notes |
|--------|------------------|-------|
| GET | /health | Health check |
| GET | /gramadevata/health | Health check |
| GET | /gramadevata/api/temples/{id} | Temple detail (extra) |
| — | /gramadevata/temple_festivals (CRUD 6) | Temple festivals module |

---

## Pending by Priority

| Priority | Category | Pending | Notes |
|----------|----------|---------|-------|
| ✅ Done | Temple (inactive, merge, locations, detail) | 0 | Completed |
| ✅ Done | Profile Management | 0 | Completed |
| 🟡 Medium | Events (location-based) | 3 | Location queries |
| 🟡 Medium | Goshala (location-based) | 2 | Location queries |
| 🟡 Medium | Hospital (location + merge) | 2 | |
| 🟡 Medium | Restaurant (location + merge) | 2 | |
| 🟡 Medium | Pooja Store (location + merge) | 2 | |
| 🟡 Medium | Village (location + merge) | 2 | |
| 🟡 Medium | Share | 2 | |
| 🟡 Medium | Auth (SSO + token refresh) | 2 | |
| 🟢 Low | Blood Bank PATCH | 1 | Minor gap |
| 🟢 Low | Comment PATCH | 1 | Minor gap |
| 🟢 Low | Country GET by ID | 1 | Minor gap |
| 🟢 Low | Home | 1 | |

