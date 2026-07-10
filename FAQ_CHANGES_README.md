# FAQ Changes README

This document records the FAQ alignment work completed for the Aloha Car Rental website.

## Goal

Make the website FAQ match the combined source of truth from:

- `public/Algemene Voorwaarden  Aloha.pdf`
- `public/Terms and Conditions  ALoha.pdf`
- `public/Términos y Condiciones Aloha.pdf`
- `public/FAQ ALOHA WEBSITE.pdf`

The FAQ data was updated in:

- `lib/faq.ts`

The FAQ now reflects the combined intent of the Dutch, English, and Spanish terms together with the FAQ PDF notes.

## Files Changed

- `lib/faq.ts`
- `FAQ_CHANGES_README.md`

## Removed FAQ Items

These items were removed from the website FAQ because the FAQ PDF explicitly marked them as remove:

- `theft`
  - English: `What should I do if the rental car is stolen?`
  - Dutch: `Wat moet ik doen bij diefstal van de huurauto?`
  - Spanish: `¿Qué debo hacer si roban el auto alquilado?`
- `early-flight-return`
  - English: `Where do I leave the vehicle if my flight departs before opening hours?`
  - Dutch: `Waar laat ik het voertuig als mijn vlucht vertrekt vóór openingstijd?`
  - Spanish: `¿Dónde dejo el vehículo si mi vuelo sale antes del horario de apertura?`

## Kept But Corrected

These existing FAQs were kept, but their answers were changed to match the PDFs more closely.

### Accident

Updated to reflect:

- calling `911` for emergencies
- mandatory CRS contact
- CRS phone: `+599 717 9292`
- CRS WhatsApp: `+599 795 9292`
- immediate notification to Aloha after contacting CRS
- do not move the vehicle until instructed
- do not leave the scene before reporting is complete
- risk of invalid insurance if reporting is not done correctly

### Damage

Updated to reflect:

- mandatory CRS contact for damage handling
- immediate follow-up contact with Aloha
- do not move the vehicle until instructed
- insurance risk if CRS/police reporting is missing

### Minimum Age

Updated from generic wording to specific policy:

- standard minimum age is `21`
- ages `19-20` are allowed with a `$750` deposit
- ages `21+` require a `$500` deposit
- all drivers must be authorized on the rental agreement

### Insurance and Deposit

Updated to reflect the terms exactly:

- rental includes basic `CDW`
- deductible is `$500` for cars
- deductible is `$600` for pickups, jeeps, SUVs, and vans
- full insurance deductible is `$100`
- full insurance covers theft, joy-riding, and single-vehicle accidents
- police report is mandatory
- exclusions include DUI, drugs, speeding, off-road driving, and third-party damage above `$50,000`
- renter remains responsible for full damages when coverage is not accepted or invalidated
- includes water-damage responsibility

### Payment Methods

Updated to reflect the FAQ PDF and terms:

- accepts cash in `US dollars`
- accepts `Maestro`, `Visa`, `Mastercard`, `Discover`, and `Diners Club`
- `American Express (AMEX)` is not accepted
- `6%` administration fee applies to credit card payments
- renter payment authorization for damages/losses is mentioned

### Euros

Aligned all language versions to the same meaning:

- euros are not accepted
- cash payments can be made in `US dollars`
- mobile bank pin machine payment remains mentioned

### Fuel Policy

Confirmed and kept aligned with the terms:

- `full-to-full`
- missing fuel charged at `$20` per `1/8 tank` for cars
- missing fuel charged at `$25` per `1/8 tank` for jeeps, SUVs, vans, and pickups
- no refunds for extra fuel

### Authorized Drivers

Updated to stronger contractual wording:

- only the lessee and listed additional drivers may drive the vehicle

### Delivery

Corrected a direct conflict between live FAQ content and the FAQ PDF:

- old website answer said delivery to preferred location was available
- new answer says vehicles are collected from the main office
- complimentary shuttle is available from airport, hotels, and most of Bonaire
- Rincon shuttle is extra

### Airport Pickup

Corrected to match the FAQ PDF:

- no direct terminal desk handoff
- office is about `5 minutes` from the airport
- complimentary pickup service takes customers to the office

### Advance Booking

Adjusted to avoid unsupported claims:

- removed the old `up to one year in advance` statement
- now advises booking as early as possible
- keeps the `within 24 hours contact us directly` rule

### Minimum Rental Rules

Updated to match the FAQ PDF wording:

- online bookings are optimized for a `3-day minimum`
- shorter rentals may still be possible at a premium rate through direct contact

### Last-Minute Booking

Kept as a valid FAQ item:

- direct contact is required for last-minute bookings within `24 hours`
- site booking rules may still control surcharge or manual handling behavior

### Long-Term Rentals

Kept:

- long-term rentals remain available by direct contact

### Partner Vehicles

Updated to match the FAQ PDF better:

- if fully booked, Aloha may still secure a vehicle through local partners
- customer should contact Aloha directly even if online availability is full

## Added FAQ Items

These FAQ items were added because they were either explicitly listed in the FAQ PDF as additions, or clearly required by the rental terms.

### Added from FAQ PDF

- `pricing-includes`
  - Do rental prices include taxes and insurance?
- `wrong-fuel`
  - What should I do if I fill the car with the wrong fuel?
- `lost-keys`
  - What should I do if I lose the car keys?
- `warning-light`
  - What should I do if a warning light appears on the dashboard?
- `breakdown`
  - What should I do if the car breaks down or will not start?

### Added from Terms and Conditions

- `off-road`
  - Off-road, white sand, and dunes are not permitted
- `flat-tire`
  - Flat tire assistance and `$35` repair cost
- `returns`
  - Vehicles must be returned to the same pickup location
- `cleanliness`
  - Vehicle must be returned clean, and personal belongings are the renter's responsibility
- `soft-top-jeeps`
  - Jeep soft tops must be closed overnight and in rain

## Language Coverage

All FAQ updates were applied across:

- English (`en`)
- Dutch (`nl`)
- Spanish (`es`)

This keeps the public FAQ content aligned across the supported locales.

## Validation

Validation completed:

```bash
npx tsc --noEmit
```

Result:

- passed successfully

## Summary

The FAQ now:

- matches the legal terms more closely
- follows the explicit keep/remove/add notes from the FAQ PDF
- removes conflicting answers
- adds missing renter-responsibility and support topics
- keeps English, Dutch, and Spanish content aligned
