# Project End Goal: Family Discovery from Untagged Gallery

## Real-World Scenario
Given ALL photos from a criminal's smartphone gallery, identify which people in those photos are family members of the device owner.

## What We're Building
A system that:
1. Takes an untagged photo gallery (mix of family + random people) AND processes live/continuous video streams (RTSP from Milestone VMS or similar sources)
2. Extracts faces from both static images and video frames
3. Uses a trained kinship verification model to score face pairs
4. Clusters/groups faces that belong to the same family
5. Outputs: "these N people are likely family members"

## How We Simulate This
- We use existing kinship datasets (images/dataset_50fam, images/fiw_enriched (most accurate and used for testing))
- Mix 1 family's images into a pool of random gallery images
- The model must find/recover that family from the mixed pool
- Success = correctly identifying family members from noise

## Current Pipeline
1. Face detection + alignment (InsightFace)
2. Embedding extraction (InsightFace 512-dim + FaCoR cross-attention)
3. Pairwise kinship scoring (compact features: cosine, L2, FaCoR)
4. Clustering (DBSCAN/Leiden) to group family members
5. Evaluation: B³ F1, purity, recall, detection rate

## Key Constraint
- Hardware agnostic (must work on CPU and GPU)
- The gallery search is the FINAL evaluation — everything else builds toward it

## New Project: Infinite Video Processing

### Goal
Process infinite/continuous video streams from RTSP sources (e.g., Milestone VMS), extract faces from video frames in real-time, and run the kinship/face analysis pipeline on them.

### RTSP Stream Details
- Protocol: Real-Time Transport Protocol (RTP) over TCP
- Supported codecs: H.264, H.265, MPEG-4
- Production source: Milestone VMS (license pending)

### Immediate Task
Set up RTSP stream handling using VLC as a local simulator before the Milestone VMS license arrives. This allows developing and testing the video ingestion pipeline against a realistic RTSP source without production infrastructure.