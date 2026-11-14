// WHAT:    Keeps the view in the address bar so any view can be shared (F7).
// IN:      Site id, camera, targets, suit settings, mode.
// OUT:     A hash string, and the state read back from one.
// USED BY: src/main.ts.
// RULES:   Reloading a copied link restores the same view. No site in the address means the globe.
// TRAPS:   PITFALLS 10.
// OWNER:   Role B.
