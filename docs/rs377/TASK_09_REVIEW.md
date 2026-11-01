# Task 9: Licence and security review

JoshRS and pinned RS-SDK both use MIT licences. Preserve their respective copyright notices for reused code. Do not distribute third-party game assets without permission.

Keep credentials and player data out of the repository. Review bot inputs as untrusted. Require isolated testing and approval for production access. The existing harness action guard does not establish live safety.

This is a source review, not a live test.
