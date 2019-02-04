#![warn(missing_debug_implementations, missing_docs)]
#![allow(unused_imports, missing_debug_implementations, missing_docs)]
use std::{
    collections::BTreeMap,
    convert::TryFrom,
    error::Error,
    fmt::Debug,
    fs::File,
    io::{prelude::*, BufReader, BufWriter},
    num::NonZeroU64 as p64,
    ops::Deref,
    rc::Rc,
};

use xz2::read::XzDecoder;

use speedruncom_data_tools::{database::Database, normalized_types::*, DynError};

fn main() -> Result<(), DynError> {
    env_logger::try_init_from_env(env_logger::Env::new().default_filter_or(format!(
        "{}=trace,speedruncom_data_tools=trace",
        module_path!()
    )))?;

    let users_xz = include_bytes!("../../data/normalized/users.bin.xz");

    Ok(())
}

fn load_included_data() -> Result<Database, DynError> {
    let database = Database;

    Ok(database)
}
