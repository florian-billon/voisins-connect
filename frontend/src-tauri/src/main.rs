// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // The frontend is bundled from a static export (`frontendDist = ../out`),
    // so the desktop app must not try to boot a separate Next.js server at runtime.
    app_lib::run();
}
