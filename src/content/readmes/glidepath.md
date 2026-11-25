C++ flight software for a Cessna 172 in the JSBSim flight dynamics model. It takes off from and lands on runway 31 at Palo Alto (KPAO), including landings in 5 and 10 kt crosswinds. The autopilot uses the navigation estimate from simulated sensors. FlightGear and Lichtblick display the flight.

## Scenarios

| name | flight |
|---|---|
| `hold`, `climb`, `turn`, `slow`, `tour` | cruise at 4000 ft with altitude, heading and airspeed changes |
| `approach` | a flight plan onto final for runway 31 and a low pass |
| `autoland` | final approach fix to a stop on runway 31 |
| `autoland_xwind_{left,right}_{5,10}` | the same with a 5 or 10 kt crosswind |
| `takeoff` | takeoff from runway 31 and climb to 1000 ft |

## Method

The flight software runs at 40 Hz and JSBSim at 120 Hz.

![Diagram of how glidepath fits together](/media/diagrams/glidepath.svg)

### Control

Cascaded PID loops on elevator, aileron, rudder and throttle hold altitude, heading and airspeed. Flight plans are flown with L1 lateral guidance (Park, Deyst and How, 2004).

### Landing and takeoff

The approach tracks the runway centerline and a 3° glideslope. The flare starts at 6 m. After touchdown the throttle goes to idle and the brakes stop the aircraft. In a crosswind the aircraft crabs into the wind on final, aligns with the runway using rudder before touchdown, and holds the wings level on the rollout.

Takeoff is a ground roll on the centerline, rotation, climb-out and level-off at 1000 ft.

### Navigation

A Mahony complementary filter estimates attitude from the gyro, accelerometer and magnetometer. The aircraft's acceleration, from successive GNSS velocities, is subtracted from the accelerometer before it is used as the gravity reference.

A linear Kalman filter estimates position and velocity in a local north-east-down frame. IMU acceleration drives the prediction. GNSS position and velocity, barometric altitude, and radar altitude between 0.5 and 50 m correct it.

Airspeed comes from the pitot tube.

### Sensors

| sensor | rate |
|---|---|
| IMU | 40 Hz |
| GNSS | 10 Hz |
| barometer, magnetometer, pitot | 20 Hz |
| radar altimeter | 40 Hz |

All sensors have white noise. The IMU also has a constant bias drawn at the start of each run.
