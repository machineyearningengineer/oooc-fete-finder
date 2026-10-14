# Offline mutation queue

[pending-mutation-queue.ts](pending-mutation-queue.ts) persists save/unsave event changes for retry after a connection returns. Its current consumer is `saved_event`.

Every mutation is scoped by `ownerKey` and carries an idempotency key. Compact repeated desired-state changes with last-write-wins behavior, so a later unsave supersedes an earlier save.

Keep analytics queues separate. Add a new mutation type when its product flow exists, and prefer a server endpoint that accepts the final desired state over replaying a sequence of actions.
