// Dev-only fixture matching the API contract documented in ARCHITECTURE.md.
// Used when the app is loaded with ?mock=1 so the UI can be built/verified
// without a live backend. Not used in the normal fetch path.
export const sampleResponse = {
  route: {
    geometry: {
      type: 'LineString',
      coordinates: [
        [-96.797, 32.7767],
        [-97.2, 33.5],
        [-97.51, 35.47],
        [-95.5, 37.0],
        [-92.3, 38.9],
        [-89.6, 39.7],
        [-87.63, 41.88],
      ],
    },
    distance_miles: 963.2,
    duration_hours: 14.8,
    legs: [
      { from: 'current', to: 'pickup', distance_miles: 190.1, duration_hours: 3.0 },
      { from: 'pickup', to: 'dropoff', distance_miles: 773.1, duration_hours: 11.8 },
    ],
  },
  stops: [
    {
      type: 'pickup',
      location: 'Oklahoma City, OK',
      lat: 35.47,
      lon: -97.51,
      arrival_hour: 3.0,
      duration_hours: 1.0,
    },
    {
      type: 'fuel',
      location: 'mile 1000',
      lat: 38.9,
      lon: -92.3,
      arrival_hour: 9.5,
      duration_hours: 0.5,
    },
    {
      type: 'rest_10hr',
      location: 'mile 1180',
      lat: 39.7,
      lon: -89.6,
      arrival_hour: 14.0,
      duration_hours: 10.0,
    },
    {
      type: 'dropoff',
      location: 'Chicago, IL',
      lat: 41.88,
      lon: -87.63,
      arrival_hour: 26.8,
      duration_hours: 1.0,
    },
  ],
  daily_logs: [
    {
      date_offset: 0,
      segments: [
        { status: 'off_duty', start_hour: 0, end_hour: 6 },
        { status: 'on_duty', start_hour: 6, end_hour: 6.5 },
        { status: 'driving', start_hour: 6.5, end_hour: 9.5 },
        { status: 'on_duty', start_hour: 9.5, end_hour: 10.0 },
        { status: 'driving', start_hour: 10.0, end_hour: 14.0 },
        { status: 'off_duty', start_hour: 14.0, end_hour: 24.0 },
      ],
      recap: { on_duty_hours_today: 5.0, driving_hours_today: 7.0, miles_driven_today: 749.2, cycle_hours_used: 17.5 },
    },
    {
      date_offset: 1,
      segments: [
        { status: 'off_duty', start_hour: 0, end_hour: 2 },
        { status: 'driving', start_hour: 2, end_hour: 4 },
        { status: 'on_duty', start_hour: 4, end_hour: 5 },
        { status: 'off_duty', start_hour: 5, end_hour: 24 },
      ],
      recap: { on_duty_hours_today: 3.0, driving_hours_today: 2.0, miles_driven_today: 214.0, cycle_hours_used: 22.5 },
    },
  ],
}
