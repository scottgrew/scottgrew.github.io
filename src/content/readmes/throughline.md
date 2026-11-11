Real-time multi-object tracker for Waymo Open Dataset LiDAR, written in C++. It takes a
detector's 3D boxes for each scan, keeps a persistent ID on every car and pedestrian through
missed detections, and forecasts each one three seconds ahead. The scene streams to Lichtblick
while it runs.

## Results

MOTA from Waymo's evaluator at LEVEL_2, on three validation clips. The input is CasA's
published detections. Boxes under 0.5 confidence are dropped, or under 0.7 for pedestrians.

| scene                       | cars | people |
|-----------------------------|------|--------|
| fast road, 63 km/h          | 0.30 | 0.22   |
| crawling through a junction | 0.54 | 0.57   |
| slow turn, 21 km/h          | 0.72 | 0.34   |

Most of the errors on the fast road are distant cars the detector missed. A frame takes 3 to
4 ms at the median and about 7 ms at the 99th percentile, against 100 ms between scans.

## How it works

Each track runs an extended Kalman filter over position, heading, speed and turn rate. New
boxes are matched to predicted tracks with the Hungarian algorithm, and pairs that are too far
apart are rejected. A track is confirmed after 3 hits and dropped after 5 misses.

![Diagram of how throughline fits together](/media/diagrams/throughline.svg)
