
# Gramadevata: Django → Node.js Migration Status

| Metric                    | Count | Percentage |
|---------------------------|-------|------------|
| **Total Django Endpoints** | ~463  | 100%       |


## PENDING - Django Endpoints NOT Yet in Node.js

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


### 14. Village - Additional Endpoints (2 endpoints)
| Method | Django Endpoint | Node Status |
|--------|----------------|-------------|
| GET | /villages_by_location | ❌ Pending |
| PUT | /mergevillage/{village_id}/ | ❌ Pending |



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

