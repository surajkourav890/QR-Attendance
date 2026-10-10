# QR Attendance

QR Attendance helps teachers record and review class attendance using student QR codes.

## Start scanning

Run npm install, then npm run dev. The app opens directly in the QR scanner and creates a Quick Attendance session for the current date. The browser will ask for camera access.

Close the scanner to open the calendar. The calendar, class registers, attendance records, and CSV/PDF exports remain available from the bottom navigation.

## Features

- Create class sessions by date.
- Scan a QR code containing a student's roll or enrollment number.
- Maintain class rosters and monthly attendance registers.
- Review records by date, class, or student.
- Export registers and attendance reports as CSV or PDF.

## Data storage

Attendance sessions, student rosters, and register data are stored in the browser's local storage. They are specific to that browser and device.

## Build and checks

Use npm run build to create a production build.
Use npm run lint for lint checks.
Use npm test to run the current test suite.
