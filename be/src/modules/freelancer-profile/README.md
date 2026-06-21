# Freelancer Profile API Documentation

## Endpoints

### Profile
- `GET /freelancer-profile/me`
- `POST /freelancer-profile`
- `PUT /freelancer-profile/me`

### Portfolio
- `GET /freelancer-profile/portfolio`
- `POST /freelancer-profile/portfolio`
- `PUT /freelancer-profile/portfolio/:id`
- `DELETE /freelancer-profile/portfolio/:id`

### Certifications
- `GET /freelancer-profile/certifications`
- `POST /freelancer-profile/certifications`
- `DELETE /freelancer-profile/certifications/:id`

### CV
- `GET /freelancer-profile/cv`
- `POST /freelancer-profile/cv`

### Availability
- `PUT /freelancer-profile/availability`

## Note
All endpoints are protected by JWT auth.
