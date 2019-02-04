//! The world's worst in-memory database of normalized speedrun data.
#![warn(missing_debug_implementations, missing_docs)]
#![allow(clippy, missing_debug_implementations, missing_docs)]
use std::{
    collections::{BTreeMap, HashMap},
    convert::TryFrom,
    error::Error,
    fmt::Debug,
    fs::File,
    io::{prelude::*, BufReader, BufWriter},
    num::NonZeroU64 as p64,
    ops::Deref,
    rc::Rc,
};

use chrono::{DateTime, NaiveDate, Utc};
use flate2::{read::GzDecoder, write::GzEncoder};
use getset::Getters;
use itertools::Itertools;
#[allow(unused)] use log::{debug, error, info, trace, warn};
use serde::{Deserialize, Serialize};
use url::Url;
use validator::{Validate, ValidationError, ValidationErrors};
use validator_derive::Validate;

use crate::normalized_types::*;

#[derive(Debug, Default, Serialize, Deserialize, Clone, Getters)]
#[get = "pub"]
pub struct Database {
    runs:       BTreeMap<p64, Run>,
    users:      BTreeMap<p64, User>,
    games:      BTreeMap<p64, Game>,
    categories: BTreeMap<p64, Category>,
    levels:     BTreeMap<p64, Level>,
}

impl Database {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert_game(&mut self, game: Game) {
        self.games.insert(*game.id(), game);
    }

    pub fn insert_user(&mut self, user: User) {
        self.users.insert(*user.id(), user);
    }

    pub fn insert_run(&mut self, run: Run) {
        self.runs.insert(*run.id(), run);
    }

    pub fn insert_level(&mut self, level: Level) {
        self.levels.insert(*level.id(), level);
    }

    pub fn insert_category(&mut self, category: Category) {
        self.categories.insert(*category.id(), category);
    }

    /// Generates an index mapping Games to sorted lists of Runs.
    pub fn runs_by_game_id(&self) -> HashMap<p64, Vec<&Run>> {
        info!("Indexing runs by game id...");
        let mut index = HashMap::new();

        for game_id in self.games().keys() {
            index.insert(*game_id, vec![]);
        }

        for run in self.runs().values() {
            index.get_mut(run.game_id()).unwrap().push(run);
        }

        for game_runs in index.values_mut() {
            game_runs.sort();
        }

        index
    }

    /// Generates an index mapping Games to sorted lists of Runs.
    pub fn games_by_slug(&self) -> HashMap<&str, &Game> {
        info!("Indexing games by slug...");
        let mut index: HashMap<&str, &Game> = HashMap::new();

        for game in self.games().values() {
            index.insert(game.slug(), game);
        }

        index
    }
}

impl Validate for Database {
    fn validate(&self) -> Result<(), ValidationErrors> {
        fn validate_table<T: Validate + Debug>(
            table: &BTreeMap<p64, T>,
        ) -> Result<(), ValidationErrors> {
            for item in table.values() {
                let result = item.validate();
                if let Err(ref error) = result {
                    error!("{} in {:?}", &error, &item);
                }
                result?;
            }
            Ok(())
        }

        // TODO:
        // foreign keys
        // unique constraints
        // indexed by id

        info!("Validating {} normalized games...", self.games().len());
        validate_table(self.games())?;
        info!("Validating {} normalized users...", self.users().len());
        validate_table(self.users())?;
        info!("Validating {} normalized runs...", self.runs().len());
        validate_table(self.runs())?;
        info!("Validating {} normalized levels...", self.levels().len());
        validate_table(self.levels())?;
        info!(
            "Validating {} normalized categories...",
            self.categories().len()
        );
        validate_table(self.categories())?;

        Ok(())
    }
}

#[derive(Debug, Clone, Getters)]
#[get = "pub"]
pub struct DbRun {
    database: Rc<Database>,
    run:      Run,
}

impl DbRun {
    pub fn game(&self) -> Game {
        self.database
            .games()
            .get(self.game_id())
            .expect("foreign key should be valid")
            .clone()
    }
}

impl Deref for DbRun {
    type Target = Run;

    fn deref(&self) -> &Run {
        &self.run
    }
}
