# Accepted architecture — revision 1

One process, one in-memory counter instance per createCounter() call. counter.js owns state; tests
exercise public behavior. An async yield must not cause accepted updates to be lost. No distributed
consistency guarantee. Do not add infrastructure to repair an in-process concurrency defect.
