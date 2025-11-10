# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of aissist CLI
- Goal tracking with deadlines
- Todo management with priorities
- Daily history logging
- Context-specific notes
- Guided reflection system
- Semantic recall with AI-powered search
- GitHub history import
- Claude Code plugin with slash commands
- AI-powered todo extraction from context
- Conversational chat interface
- Automated CI/CD workflows
- YAML front matter support for all entry types
- Migration utilities for converting inline format to YAML
- Auto-detection of entry format (YAML vs inline)
- Schema versioning for YAML front matter (`schema_version` field)

### Changed
- **File Format Migration**: All entry types now use YAML front matter for metadata
  - Goals: `timestamp`, `codename`, `deadline`, `description` moved to YAML
  - Todos: `timestamp`, `completed`, `priority`, `goal` moved to YAML
  - History: `timestamp`, `goal` moved to YAML
  - Context: `timestamp`, `source`, `goal` moved to YAML
  - Old inline format remains supported for backward compatibility
  - New entries are automatically created in YAML format
- **Schema Versioning**: All YAML front matter now includes `schema_version: "1.0"`
  - Enables future format evolution with explicit version tracking
  - Missing `schema_version` defaults to "1.0" for backward compatibility
  - Unknown versions log warning and fall back to "1.0"

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- None

## [1.0.0] - TBD

Initial release. See [Unreleased] section for features.

[unreleased]: https://github.com/OWNER/aissist/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/OWNER/aissist/releases/tag/v1.0.0
