# Breeze Technician Frontend Update

This package contains a clean frontend structure for the technician area.

## What changed

- Removed the bottom tab navigator.
- Added a professional top header for web/tablet.
- Added a hamburger menu for mobile.
- Added Home and Privacy Policy navigation.
- Added a reusable Work Order screen with up to three ticket sections.
- Kept the existing authentication and admin flows.
- Connected Work Order submission to the existing backend endpoint:
  `POST /api/work-orders`

## Copy into your project

Copy `App.js` and the `src` folder into the existing Expo project.

Do not delete your existing `.env`.

Your frontend `.env` should contain the backend URL, for example:

```env
API_BASE_URL=http://192.168.1.20:5000/api
```

For Android Emulator:

```env
API_BASE_URL=http://10.0.2.2:5000/api
```

For web:

```env
API_BASE_URL=http://localhost:5000/api
```

Restart Expo after changing `.env`:

```bash
npx expo start -c
```

## Navigation dependency

Only the native stack navigator is used. The bottom-tabs package is not required.

## Dummy Work Order values

The Property and Unit options in `TicketFormSection.js` are temporary.
Replace them later with values returned by your backend.

The Work Order request sent to the backend is:

```json
{
  "tickets": [
    {
      "ticketId": "1234-1",
      "city": "Youngstown",
      "technicianName": "Technician Name",
      "property": "Property_1",
      "unit": "Unit_1",
      "status": "Completed",
      "clockIn": "09:00 AM",
      "clockOut": "11:00 AM",
      "jobType": "Maintenance",
      "date": "2026-07-28",
      "workDetails": "Work completed"
    }
  ]
}
```
