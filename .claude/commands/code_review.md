We just implemented the feature described in the attached plan.

Please do a thorough code review:

• Make sure that the plan was correctly implemented.
• Look for any obvious bugs or issues in the code.
• Look for subtle data alignment issues (e.g. expecting snake_case but getting camelCase or expecting data to come through in an object but receiving a nested object like {data:{}})
• Look for any over-engineering or files getting too large and needing refactoring
• Look for any weird syntax or style that doesn't match other parts of the codebase
• Did we add quality tests? Prefer fewer, high quality tests. Prefer integration tests for user flows
• Are there places we should use caching?
• Look at documentation of the code, is it self documented ? , is it well commented ?
• is outdated comments or documentation exists?
• when above all the steps are done then run pre-commits and check for any issues and solve them.
• keep in mind that fewer lines and simpler code is better.

Document your findings in docs/features/<N>\_REVIEW.md unless a different file name is specified.
****