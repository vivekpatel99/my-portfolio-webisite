# Sports analytics media

On 10 October 2026, Viv requested adding the images and video in `missing-assests/sport-analytics` to the sports analytics case study. This record documents that direct instruction and the supplied files. PR review, merge and production release remain separate steps.

The current article and collection cover is the source-aligned **Recorded match to labeled video** diagram. The gallery includes the football tracking video and both detector evaluation plots. It uses image enlargement, thumbnails, keyboard navigation and native video controls.

The later [source and media review](factual-review.md) verified the football project against its public YOLO and ByteTrack implementation. That review replaced the earlier pose, shot and rally description, which came from an unrelated padel archive. The supplied illustration's real-time and win claims are absent from the public gallery. The detector captions describe the repository's 49-image validation scope without claiming tracking accuracy or processing speed. The video's visible team-colored IDs match the football project.

The supplied-file table and verification below record the initial media integration. The latest public scope is the football article described above. Final cleanup removes the obsolete football illustration, its display copies and thumbnail registry entries. Publication tests use the current source-aligned cover as their image fixture.

| Supplied file | Initial repository asset | Supplied SHA-256 |
| --- | --- | --- |
| image_original | sports-football-workflow.png | fa3e0352229ccf27bfc674ed45ef2d3f99abd896dd196f888f8ea1bb60a999b6 |
| image_original (1) | sports-football-f1-confidence.png | 17675c81b372e6fb4505c19e5fe2d22c3eefdacc34b1ad9c4d12c6ca24edf0dc |
| image_original (2) | sports-football-confusion-matrix.png | d039a81022e6edc6b245623ac0ecb71f16b1cc0fcbb37e9532e85ba4b1b966be |
| vgimrvshcv0fsf47agmk.mp4 | sports-football-tracking.mp4 | aae7bb9586bf40fc4af033054471155090350f0bb6a62252bb842fe9e0627319 |

PNG assets preserve source dimensions and pixels while stripping metadata. The MP4 retains the supplied H.264 video stream at 640 by 360 for 30 seconds, with fast-start metadata moved before the video data. It has no audio stream. The poster is a frame at 10 seconds. Bounded WebP display copies and JPEG thumbnails use the existing derivative registry; enlarged images retain full resolution. Exact published-byte hashes are in the publication approval and derivative records.

## Verification

- The production build passes, including derivative validation, the sitemap, and static HTML for 21 routes. The build ran in a disposable copy outside the shared checkout.
- Focused publication, gallery, article, derivative, production-eligibility, and route-integrity suites pass with 101 tests across nine files.
- The production preview renders all four gallery items at desktop width and at 375px. Keyboard selection, enlarged-image viewing, captions, poster loading, and 30-second video playback pass. The mobile page has no horizontal overflow.
- Direct pixel comparison confirms all three published PNGs preserve their source pixels. An extracted-stream hash comparison confirms the remuxed MP4 preserves the supplied H.264 stream.
- A fresh read-only review found no actionable issues in the scoped change. Production deployment and physical-device checks were not run.
