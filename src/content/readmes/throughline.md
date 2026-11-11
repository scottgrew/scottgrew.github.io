A live C++ tracker for road users in Waymo LiDAR data.

It takes a detector's boxes as each scan arrives and keeps one ID per object through missed
scans. Each track carries a speed, a turn rate and a three-second forecast, and the scene
streams to a viewer while it runs.

## Results

The input boxes are CasA's published detections on Waymo's validation set, which is real
detector output with its misses and false alarms. Boxes scoring under 0.5 are dropped, and
pedestrian boxes under 0.7.

MOTA is the standard tracking score, where 1.0 means no mistakes. Waymo's own scoring code
gave these numbers:

| scene                       | cars | people |
|-----------------------------|------|--------|
| fast road, 63 km/h          | 0.30 | 0.22   |
| crawling through a junction | 0.54 | 0.57   |
| slow turn, 21 km/h          | 0.72 | 0.34   |

Most lost points on the fast road are misses: the detector does not see distant cars that
the labels contain, and the tracker waits two scans before it reports a new object.

A frame takes 2 to 4 ms at the median and under 8 ms at the 99th percentile. Scans arrive
every 100 ms.

## Architecture

![Diagram of how throughline fits together](/media/diagrams/throughline.svg)
