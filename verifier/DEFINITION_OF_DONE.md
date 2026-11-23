# Definition of done

A bucket is done only when all of these are true:

1. Every criterion in `verifier/<bucket>.md` passes, with real evidence (command output,
   screenshots, or a written result from a manual phone check).
2. Tests and linter/analyzer were run and their actual output was shown.
3. The independent `verifier` agent reviewed the bucket against its spec and criteria.
4. Michael approved it. The spec status is then set to Verified in `specs/README.md`.
