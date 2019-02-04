//! Tools to download, search, and mirror https://speedrun.com leaderboards.
#![feature(associated_type_defaults, proc_macro_hygiene, label_break_value)]
#![allow(missing_docs, clippy::useless_attribute, clippy::useless_vec)]
#![warn(missing_debug_implementations)]
#![deny(unconditional_recursion)]

/// Types for the speedrun.com API data we consume and utilities for normalizing it.  
pub mod api;
/// Our normalized data types, a frozen in-memory database, and leaderboard logic.
pub mod data;
/// An HTTP server displaying leaderboards from a copy of the normalized database.
pub mod server;
/// Utilities that should probably go somewhere more specific.
pub mod utils;

pub use crate::data::{
    database::Database,
    types::{self, *},
};
