Motion prediction for the Waymo Open Motion Dataset, in Python and PyTorch. From one second of
a road user's history, the traffic around it, the lane geometry and the traffic-light states,
it predicts six possible paths for the next eight seconds, each with a confidence. A car
approaching a junction may turn or continue straight, and a single prediction would average
the two.

## Results

minADE is the mean distance, in metres, between the recorded path and the closest of the six
predictions. Lower is better.

| minADE (m)                | 3 s  | 5 s  | 8 s   |
|---------------------------|------|------|-------|
| cars, validation          | 0.35 | 0.74 | 1.44  |
| cars, test                | 0.35 | 0.74 | 1.43  |
| cars, control             | 2.33 | 5.47 | 10.98 |
| pedestrians, validation   | 0.19 | 0.37 | 0.65  |
| pedestrians, test         | 0.19 | 0.37 | 0.65  |
| pedestrians, control      | 0.47 | 0.89 | 1.55  |
| cyclists, validation      | 0.38 | 0.71 | 1.26  |
| cyclists, test            | 0.37 | 0.71 | 1.28  |
| cyclists, control         | 1.14 | 2.26 | 4.17  |

Soft mAP, the metric Waymo ranks this challenge by, averaged over every object type and
horizon: 0.357 on validation, 0.353 on test.

Validation (44,097 scenes) and test (44,920 scenes) were graded by Waymo's evaluation server.
The control assumes constant speed and heading, scored with Waymo's metric code on the
validation scenes. The model has 12M parameters and was trained for 20 epochs on 122,352
scenes, a quarter of the training split.

## Method

1. Before training, the endpoints of the training paths are clustered with k-means into 54
   typical destinations per object type: straight and far, gentle left, hard right. These are
   the anchors.
2. Each road user being predicted is seen in its own frame, with its history, the 48 other
   agents and 256 map chunks nearest the straight path it would cover in 8 s, and the
   traffic-light states.
3. A 6-layer transformer encoder reads the scene. A 6-round transformer decoder starts one
   query from each anchor and adjusts that anchor's path, and a second head scores how likely
   each anchor is.
4. Training uses a Gaussian likelihood on one anchor's path plus cross-entropy on the
   confidences. The anchor trained is the one whose constant-speed straight path lies closest
   to the recorded path.
5. At prediction time the 54 paths are ranked by confidence, near-duplicates are dropped, and
   the top six are kept. The whole model also exports to one ONNX graph, checked against
   PyTorch.

![Diagram of how motionnet fits together](/media/diagrams/motionnet.svg)
