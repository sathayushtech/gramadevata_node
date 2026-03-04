
# Gramadevata: Django → Node.js Migration Status

**Date:** 4 March 2026

---

## Summary

| Metric                    | Count | Percentage |
|---------------------------|-------|------------|
| **Total Django Endpoints** | ~463  | 100%       |
| **Done in Node.js**        | ~318  | **~69%**   |
| **Pending in Node.js**     | ~145  | **~31%**   |

---

## DONE - Endpoints Already in Node.js (~318 endpoints)

| Category | Endpoints | Count |
|----------|-----------|-------|
| Health | GET /health, GET /gramadevata/health | 2 (Node-only) |
| Auth | POST /register, POST /verify, GET /admin_profile_get_by_id/{id} | 3 |
| Comments | CRUD /comments + POST mark-as-inactive | 7 |
| Events by Location | GET state_id, district_id, block_id | 3 |
| add_more_event_details | CRUD (GET, POST, GET/{id}, PATCH/{id}, PUT/{id}, DELETE/{id}) | 6 |
| event | CRUD | 6 |
| eventcategory | CRUD | 6 |
| eventmerge | PUT /{event_id} | 1 |
| eventpost | POST | 1 |
| eventsmain | GET | 1 |
| eventsstatus | GET | 1 |
| events_inactive | GET | 1 |
| events_inactive_get | GET /{field_name}/{input_value} | 1 |
| globalevents | GET | 1 |
| village | CRUD | 6 |
| search_village | GET | 1 |
| village_inactive | GET | 1 |
| village_inactive_get | GET /{field_name}/{input_value} | 1 |
| add_more_village_details | CRUD | 6 |
| village_geographic | CRUD | 6 |
| village-famous-personalities | CRUD | 6 |
| village-development-facilities | CRUD | 6 |
| village_school | CRUD | 6 |
| village-bank | CRUD | 6 |
| village-college | CRUD | 6 |
| village-cultural-profile | CRUD | 6 |
| village-artists | CRUD | 6 |
| village-market | CRUD | 6 |
| village-postoffice | CRUD | 6 |
| village-sportsground | CRUD | 6 |
| accommodation | CRUD | 6 |
| welfare_homes_category | CRUD | 6 |
| welfare_home | CRUD + by-location + inactive + inactive_by_location | 9 |
| add_more_hospital | CRUD | 6 |
| add_more_veterinary_hospital | CRUD | 6 |
| veterinary_hospital | CRUD + by_location + merge | 8 |
| add_more_goshala_details | CRUD | 6 |
| globalgoshala | GET | 1 |
| goshala | CRUD | 6 |
| add_more_hotel | CRUD | 6 |
| add_more_pooja_store | CRUD | 6 |
| add_more_restaurants | CRUD | 6 |
| add_more_temple_details | CRUD | 6 |
| api/temples | GET list + GET /{id} | 2 |
| visit_temples | CRUD | 6 |
| citytemples_bylocation | GET | 1 |
| favorite-temples | CRUD | 6 |
| globaltemples | GET | 1 |
| templeCategeory | CRUD | 6 |
| temple_main_category | CRUD | 6 |
| templepriority | CRUD | 6 |
| temple_facilities | CRUD | 6 |
| temple_festivals | CRUD | 6 (Node-only) |
| temple-nearby-hotels | CRUD + hotels_by_location | 7 |
| temple | CRUD + locationByTemples + InactivelocationByTemples | 8 |
| temple-transports | CRUD | 6 |
| temple_pooja_timings | CRUD | 6 |
| add_more_tour-operators | CRUD | 6 |
| ambulance_facility | CRUD | 6 |
| block | CRUD | 6 |
| blood_bank | GET, POST, GET/{id}, PUT/{id}, DELETE/{id} + by_location + merge | 7 |
| chat | CRUD | 6 |
| connect | CRUD | 6 |
| country | GET (list only) | 1 |
| district | CRUD | 6 |
| delete-member | DELETE /{id} | 1 |
| delete-pujari | DELETE /{id} | 1 |
| deleteimage | POST /{id} | 1 |
| fire_station | CRUD | 6 |
| global_search | GET | 1 |

---

## PENDING - Django Endpoints NOT Yet in Node.js (~145 endpoints)

### 1. State CRUD (6 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /state | ❌ Pending |
| POST | /state | ❌ Pending |
| GET | /state/{_id} | ❌ Pending |
| PUT | /state/{_id} | ❌ Pending |
| PATCH | /state/{_id} | ❌ Pending |
| DELETE | /state/{_id} | ❌ Pending |

### 2. Profile Management (6 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| PUT | /profile/{id} | ❌ Pending |
| DELETE | /profile_delete/{id}/ | ❌ Pending |
| GET | /profile_get/ | ❌ Pending |
| GET | /profile_get_by_id/{id}/ | ❌ Pending |
| PUT | /profileimages/{id} | ❌ Pending |
| PUT | /updateroots/{id} | ❌ Pending |

### 3. Auth / SSO / Token (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /sso_login | ❌ Pending |
| POST | /token/refresh | ❌ Pending |

### 4. Temple - Additional Endpoints (15 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /temple_inactive | ❌ Pending |
| GET | /temple_inactive_get/{field_name}/{input_value} | ❌ Pending |
| GET | /templedetail/{_id}/ | ❌ Pending |
| GET | /templeget/{field_name}/{input_value} | ❌ Pending |
| GET | /templemain | ❌ Pending |
| PUT | /templemerge/{temple_id}/ | ❌ Pending |
| POST | /templepost | ❌ Pending |
| PUT | /temple_hotel_merge/{hotel_id} | ❌ Pending |
| GET | /temples/block_id/{block_id}/ | ❌ Pending |
| GET | /temples/country_id/{country_id}/ | ❌ Pending |
| GET | /temples/district_id/{district_id}/ | ❌ Pending |
| GET | /temples/state_id/{state_id}/ | ❌ Pending |
| GET | /statetemples_bylocation | ❌ Pending |
| GET | /towntemples_bylocation | ❌ Pending |
| GET | /indiatemples | ❌ Pending |

### 5. Goshala - Additional Endpoints (17 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /goshala_inactive | ❌ Pending |
| GET | /goshala_inactive_get/{field_name}/{input_value}/ | ❌ Pending |
| GET | /goshalamain | ❌ Pending |
| PUT | /goshalamerge/{goshala_id} | ❌ Pending |
| POST | /goshalapost | ❌ Pending |
| GET | /goshalas/block_id/{block_id}/ | ❌ Pending |
| GET | /goshalas/district_id/{district_id}/ | ❌ Pending |
| GET | /goshalas/state_id/{state_id}/ | ❌ Pending |
| GET | /InactivelocationByGoshalas | ❌ Pending |
| GET | /locationByGoshalas/ | ❌ Pending |
| GET | /indiagoshalas | ❌ Pending |
| **goshalacategories CRUD** | | |
| GET | /goshalacategories | ❌ Pending |
| POST | /goshalacategories | ❌ Pending |
| GET | /goshalacategories/{_id} | ❌ Pending |
| PUT | /goshalacategories/{_id} | ❌ Pending |
| PATCH | /goshalacategories/{_id} | ❌ Pending |
| DELETE | /goshalacategories/{_id} | ❌ Pending |

### 6. Event - Additional Endpoints (3 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /InactivelocationByEvents | ❌ Pending |
| GET | /locationByEvents/ | ❌ Pending |
| GET | /indiaevents | ❌ Pending |


### 10. Restaurants (8 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /restaurants | ❌ Pending |
| POST | /restaurants | ❌ Pending |
| GET | /restaurants/{_id} | ❌ Pending |
| PUT | /restaurants/{_id} | ❌ Pending |
| PATCH | /restaurants/{_id} | ❌ Pending |
| DELETE | /restaurants/{_id} | ❌ Pending |
| GET | /restaurants_by_location | ❌ Pending |
| PUT | /restaurant_merge/{restaurant_id} | ❌ Pending |

### 11. Pooja Stores (8 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /pooja_stores | ❌ Pending |
| POST | /pooja_stores | ❌ Pending |
| GET | /pooja_stores/{_id} | ❌ Pending |
| PUT | /pooja_stores/{_id} | ❌ Pending |
| PATCH | /pooja_stores/{_id} | ❌ Pending |
| DELETE | /pooja_stores/{_id} | ❌ Pending |
| GET | /pooja_stores_by_location | ❌ Pending |
| PUT | /pooja_store_merge/{pooja_store_id} | ❌ Pending |

### 12. Nearby Hospitals (8 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /nearby_hospitals | ❌ Pending |
| POST | /nearby_hospitals | ❌ Pending |
| GET | /nearby_hospitals/{_id} | ❌ Pending |
| PUT | /nearby_hospitals/{_id} | ❌ Pending |
| PATCH | /nearby_hospitals/{_id} | ❌ Pending |
| DELETE | /nearby_hospitals/{_id} | ❌ Pending |
| PUT | /nearby_hospital_merge/{hospital_id} | ❌ Pending |
| GET | /hospitals_by_location | ❌ Pending |

### 13. Blood Bank - Add More Details (6 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /add_more_blood_bank | ❌ Pending |
| POST | /add_more_blood_bank | ❌ Pending |
| GET | /add_more_blood_bank/{_id} | ❌ Pending |
| PUT | /add_more_blood_bank/{_id} | ❌ Pending |
| PATCH | /add_more_blood_bank/{_id} | ❌ Pending |
| DELETE | /add_more_blood_bank/{_id} | ❌ Pending |

### 14. Village - Additional Endpoints (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /villages_by_location | ❌ Pending |
| PUT | /mergevillage/{village_id}/ | ❌ Pending |

### 15. Pujari Category (6 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /pujari_category | ❌ Pending |
| POST | /pujari_category | ❌ Pending |
| GET | /pujari_category/{_id} | ❌ Pending |
| PUT | /pujari_category/{_id} | ❌ Pending |
| PATCH | /pujari_category/{_id} | ❌ Pending |
| DELETE | /pujari_category/{_id} | ❌ Pending |

### 16. Pujari Subcategories (6 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /pujari-subcategories | ❌ Pending |
| POST | /pujari-subcategories | ❌ Pending |
| GET | /pujari-subcategories/{_id} | ❌ Pending |
| PUT | /pujari-subcategories/{_id} | ❌ Pending |
| PATCH | /pujari-subcategories/{_id} | ❌ Pending |
| DELETE | /pujari-subcategories/{_id} | ❌ Pending |

### 17. Media (6 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /media | ❌ Pending |
| POST | /media | ❌ Pending |
| GET | /media/{_id} | ❌ Pending |
| PUT | /media/{_id} | ❌ Pending |
| PATCH | /media/{_id} | ❌ Pending |
| DELETE | /media/{_id} | ❌ Pending |

### 18. Police Station (6 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /police_station | ❌ Pending |
| POST | /police_station | ❌ Pending |
| GET | /police_station/{_id} | ❌ Pending |
| PUT | /police_station/{_id} | ❌ Pending |
| PATCH | /police_station/{_id} | ❌ Pending |
| DELETE | /police_station/{_id} | ❌ Pending |

### 19. Social Activities (6 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /social_activities | ❌ Pending |
| POST | /social_activities | ❌ Pending |
| GET | /social_activities/{_id} | ❌ Pending |
| PUT | /social_activities/{_id} | ❌ Pending |
| PATCH | /social_activities/{_id} | ❌ Pending |
| DELETE | /social_activities/{_id} | ❌ Pending |

### 20. Prayers and Benefits (6 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /prayers_and_benefits | ❌ Pending |
| POST | /prayers_and_benefits | ❌ Pending |
| GET | /prayers_and_benefits/{_id} | ❌ Pending |
| PUT | /prayers_and_benefits/{_id} | ❌ Pending |
| PATCH | /prayers_and_benefits/{_id} | ❌ Pending |
| DELETE | /prayers_and_benefits/{_id} | ❌ Pending |

### 21. Share (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /share/temple/{id}/ | ❌ Pending |
| GET | /share/{content_type}/{content_id}/ | ❌ Pending |

### 22. Home (1 endpoint)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /home | ❌ Pending |

### 23. Country - Get by ID (1 endpoint)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /country/{_id} | ❌ Pending |

---

## Pending by Category (Chart)

```
Category                     | Pending | Done in Node
-----------------------------|---------|-------------
State                        |    6    |    0
Profile Management           |    6    |    1 (admin_profile_get_by_id)
Auth / SSO / Token           |    2    |    2 (register, verify)
Temple (extra)               |   15    |   ~65
Goshala (extra + categories) |   17    |   ~13
Event (extra)                |    3    |   ~28
Tourism                      |    9    |    0
Tour Operators               |    8    |    6 (add_more_tour-operators only)
Tour Guides                  |    7    |    0
Restaurants                  |    8    |    6 (add_more_restaurants only)
Pooja Stores                 |    8    |    6 (add_more_pooja_store only)
Nearby Hospitals             |    8    |    6 (add_more_hospital only)
Blood Bank (add_more)        |    6    |    7 (blood_bank main done)
Village (extra)              |    2    |   ~75
Pujari Category              |    6    |    0
Pujari Subcategories         |    6    |    0
Media                        |    6    |    0
Police Station               |    6    |    0
Social Activities            |    6    |    0
Prayers & Benefits           |    6    |    0
Share                        |    2    |    0
Home                         |    1    |    0
Country (get by id)          |    1    |    1 (list only)
-----------------------------|---------|-------------
TOTAL PENDING                |  ~145   |
```

---

## Visual Progress

```
Overall Migration: ██████████████░░░░░░░ 69% Done | 31% Pending

By Area:
  Villages:      ████████████████████ 97%  (only merge + by_location missing)
  Events:        ████████████████████ 90%  (location/inactive extras missing)
  Temple:        ████████████████░░░░ 80%  (merge/inactive/location extras missing)
  Welfare:       ████████████████████ 100%
  Goshala:       ██████████░░░░░░░░░░ 50%  (categories, merge, location missing)
  Blood Bank:    ██████████████░░░░░░ 54%  (add_more_blood_bank missing)
  Vet Hospital:  ████████████████████ 100%
  Accommodation: ████████████████████ 100%
  Tourism:       ░░░░░░░░░░░░░░░░░░░░  0%  (entirely missing)
  Tour Operators:██████░░░░░░░░░░░░░░ 43%  (add_more done, main CRUD missing)
  Tour Guides:   ░░░░░░░░░░░░░░░░░░░░  0%  (entirely missing)
  Restaurants:   ██████░░░░░░░░░░░░░░ 43%  (add_more done, main CRUD missing)
  Pooja Stores:  ██████░░░░░░░░░░░░░░ 43%  (add_more done, main CRUD missing)
  Hospitals:     ██████░░░░░░░░░░░░░░ 43%  (add_more done, nearby missing)
  Pujari:        ░░░░░░░░░░░░░░░░░░░░  0%  (entirely missing)
  Media:         ░░░░░░░░░░░░░░░░░░░░  0%  (entirely missing)
  Police Station:░░░░░░░░░░░░░░░░░░░░  0%  (entirely missing)
  Social:        ░░░░░░░░░░░░░░░░░░░░  0%  (entirely missing)
  Prayers:       ░░░░░░░░░░░░░░░░░░░░  0%  (entirely missing)
  Profile:       ██░░░░░░░░░░░░░░░░░░ 14%  (only admin get by id)
  State:         ░░░░░░░░░░░░░░░░░░░░  0%  (entirely missing)
  Share:         ░░░░░░░░░░░░░░░░░░░░  0%  (entirely missing)
  Home:          ░░░░░░░░░░░░░░░░░░░░  0%  (entirely missing)
```

---

## Priority Recommendation

**High Priority (Core features used by main app):**
1. Tourism (9 endpoints) - entirely missing
2. Restaurants (8 endpoints) - main CRUD missing
3. Pooja Stores (8 endpoints) - main CRUD missing
4. Police Station (6 endpoints) - entirely missing
5. Nearby Hospitals (8 endpoints) - main CRUD missing
6. State CRUD (6 endpoints) - entirely missing

**Medium Priority:**
7. Goshala extras (17 endpoints) - categories, merge, location
8. Temple extras (15 endpoints) - merge, inactive, location by hierarchy
9. Tour Operators (8 endpoints) - main CRUD missing
10. Tour Guides (7 endpoints) - entirely missing
11. Profile Management (6 endpoints)
12. Pujari Category + Subcategories (12 endpoints)

**Lower Priority:**
13. Media CRUD (6 endpoints)
14. Social Activities (6 endpoints)
15. Prayers & Benefits (6 endpoints)
16. Share (2 endpoints)
17. Home (1 endpoint)
18. SSO Login + Token Refresh (2 endpoints)
19. Event extras (3 endpoints)
20. Village extras (2 endpoints)
21. Blood Bank add_more (6 endpoints)
22. Country get by ID (1 endpoint)
