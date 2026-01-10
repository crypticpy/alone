//! Alone Theme - Rust Syntax Highlighting Demo
//!
//! This module showcases various Rust language features
//! for theme preview purposes.

use std::collections::HashMap;
use std::fmt;

/// Represents a configuration with key-value pairs
#[derive(Debug, Clone, Default)]
pub struct Config {
    name: String,
    values: HashMap<String, String>,
    max_size: usize,
}

/// Trait for items that can be validated
pub trait Validate {
    /// Validates the item and returns a result
    fn validate(&self) -> Result<(), String>;

    /// Returns true if the item is valid
    fn is_valid(&self) -> bool {
        self.validate().is_ok()
    }
}

impl Config {
    /// Creates a new Config with the given name
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            values: HashMap::new(),
            max_size: 100,
        }
    }

    /// Sets a configuration value with lifetime annotation
    pub fn set<'a>(&mut self, key: &'a str, value: &'a str) -> Option<String> {
        self.values.insert(key.to_string(), value.to_string())
    }

    /// Gets a value by key, returning Option
    pub fn get(&self, key: &str) -> Option<&String> {
        self.values.get(key)
    }

    /// Processes the config based on a condition
    #[cfg(feature = "advanced")]
    pub fn process_advanced(&self) -> Result<(), ConfigError> {
        // Advanced processing logic
        Ok(())
    }
}

impl Validate for Config {
    fn validate(&self) -> Result<(), String> {
        if self.name.is_empty() {
            return Err("Name cannot be empty".to_string());
        }
        if self.values.len() > self.max_size {
            return Err(format!("Too many values: {} > {}", self.values.len(), self.max_size));
        }
        Ok(())
    }
}

impl fmt::Display for Config {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Config({}, {} values)", self.name, self.values.len())
    }
}

/// Demonstrates pattern matching and error handling
fn process_result(value: Option<i32>) -> Result<String, &'static str> {
    match value {
        Some(n) if n > 0 => Ok(format!("Positive: {}", n)),
        Some(0) => Ok("Zero".to_string()),
        Some(n) => Err("Negative values not allowed"),
        None => Err("No value provided"),
    }
}

fn main() {
    // Macro usage
    let items = vec![1, 2, 3, 4, 5];
    println!("Items: {:?}", items);

    let mut config = Config::new("app_settings");
    config.set("theme", "alone");
    config.set("version", "1.0.0");

    // Pattern matching with Result
    match config.validate() {
        Ok(()) => println!("Config is valid: {}", config),
        Err(e) => eprintln!("Validation failed: {}", e),
    }

    // Option handling with if let
    if let Some(theme) = config.get("theme") {
        println!("Using theme: {}", theme);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_creation() {
        let config = Config::new("test");
        assert!(config.is_valid());
    }
}
