# GitHub project expansion review

## Selection

The owner authorized adding worthwhile GitHub projects on 11 October 2026, with incomplete work described honestly. Reviewers checked the 59-repository catalogue and inspected source in 45 additional repositories. Three projects were selected for their implemented workflows and relevance to document automation and computer vision clients. No additional project was presented as a completed client delivery.

| Case study | Status | Reviewed implementation | Public media |
| --- | --- | --- | --- |
| Python bookkeeping reconciliation to Excel | In progress | Supported CSV importers, invoice extraction, ledger reconciliation, explicit review answers and accepted-set publication checks | Newly drawn workflow; no financial records |
| Single-camera padel video analysis prototype | In progress | Separate pose/player entry and candidate shot-tag JSON entry; rally integration unfinished | Newly drawn workflow; no client recordings |
| PyTorch image segmentation with a shared encoder | In progress | VGG encoder, FCN8/FCN16 mask decoder, classification head and training entry | Newly drawn architecture with synthetic geometry |

Private implementations are described anonymously. The segmentation article links to its public source at the reviewed commit. The evidence review inspected code and written tests; it did not execute these project implementations, train models, or validate real-world accuracy.

## Corrections from author review

- Bookkeeping: review-only copies and accepted publication are distinct. Some review states update the visible workbook without accepting the candidate set. Clear records do not all require manual approval. The tool prepares workbooks and does not submit filings; no claim is made about the owner's filing history.
- Padel: the shot entry reads video independently. It does not continue the default pose run. Rally grouping exists separately, and rally export in the default entry is commented out. Missing weights and recordings prevent an end-to-end result claim.
- Segmentation: both outputs are raw scores. They are not probabilities, a selected class or a clinically validated prediction. Conflicting result artifacts and the absence of a saved checkpoint mean no accuracy or Dice score is published.
- Accessible media explanation: the bookkeeping caption and alt text now include accepted publication, marked review-only copies, and blocked/failed checks that leave the accepted set unchanged.
- All three: no completion month, client outcome, deployment claim or measured time saving was invented. Diagrams are illustrations, with their scope stated in captions.

## Discovery and SEO

The three ongoing articles appear in a separate In progress link list on `/case-studies/`, with a matching article status and return link. The twelve completed stories retain their card grid, six-card initial view, Load more and three homepage features. The new articles use descriptive titles, unique summaries, canonical project URLs, sitemap entries, alt text and relevant service enquiry links. These changes improve discoverability; search rankings and client enquiries have not been measured.

## Verification

The candidate receipt records the exact prepared content digest and three asset digests. All twelve previous records, their claims and approval metadata, and all 46 original media files were compared against the starting PR snapshot. Existing media were retained byte for byte.

The frozen prepared candidate digest is `6e0e0fbc87825f660c9a150823d7e5e0b9f65f2af4a9175ffbdd79c0f3054ad8`.

- 984 unit tests passed in the isolated source export; nine unchanged tests requiring a Git checkout passed in the primary checkout.
- Production build passed, including integrity checks for all 48 current display derivatives, 24 static routes and 45 public links.
- Existing route, visual and evidence-label coverage passed 221 browser checks across Chromium and WebKit; one existing mobile custom-cursor test was skipped. Separate prototype coverage passed 62 checks, including media labels and keyboard return paths.
- The technical reviewer passed the new discovery/publication code and revised source-bound prose. The parent visually inspected all three final PNGs and verified preservation against the starting snapshot.
- Previous GitHub browser shards failed because a wrapping test still searched for the old n8n title. The selector now uses the stable project URL, retains the wrapping assertion and checks that exactly one label exists.

Original project code was not executed. Website tests verify rendering and publication behavior, rather than financial correctness, sports accuracy or model quality. Production release remains a separate decision.


The expert's first expansion review held the candidate for a return-navigation issue: the prototype link had `#in-progress`, but the scroll handler ignored collection-page hashes and prerendered article links omitted the fragment. Three new unit tests reproduced the failure. The collection special case now applies only when there is no hash, and ongoing static articles retain the anchor. Sixteen desktop/mobile Chromium and WebKit checks passed after the fix, verifying viewport position, focus and the static link. Completed collection restoration remains covered by the existing unit tests.

Broader WebKit route/visual/responsive coverage passed 227 checks with three existing cursor/touch skips. Two macOS first-Tab focus failures were investigated separately: Tab reached a button; Option-Tab reached the skip link. The test now waits for the loaded homepage and uses Option-Tab on macOS WebKit. Fourteen WebKit focus/label checks and two Chromium focus checks passed after this correction. The corrected bookkeeping caption also passed sixteen browser evidence-label checks at desktop, tablet and narrow-phone widths. Local SEO checks passed with no findings.

The final independent portfolio expert round passed the frozen candidate with no remaining blocking finding. See [the portfolio expert result](github-expansion-portfolio-expert-review.md). A fresh technical review also passed the final metadata and return-navigation changes.
