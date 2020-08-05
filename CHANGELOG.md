# Change Log
All notable changes to the "Projects" extension will be documented in this file.

## [0.16.0] - 2020-08-09

### Added
- Added icon color update to `Projects: Refresh Workspaces`.

## [0.15.0] - 2020-07-19

### Added
- Added colors for projects. Change icon and status bar color to 7 different colors.
- Added `Copy Path` to context menu for folders, projects and workspaces.

### Fixed
- Fixed `Projects: Go to previous Workspace` if keyboard shortcut was pressed multiple times fast.
- Fixed `Delete` in workspaces for favorites if project still exists as git repository, vscode folder or vscode workspace.

## [0.14.1] - 2020-07-05

### Fixed
- Fixed wrong name for a light theme icon.

## [0.14.0] - 2020-07-05

### Added
- Added welcome view to empty workspaces view.
- Added save dialog to unknown workspace.
- Added `l13Projects.sortWorkspacesBy` to group and sort workspaces.
- Added `l13Projects.initialWorkspacesGroupState` to set the initial state of the workspace groups.
- Added keyboard shortcuts for workspace slots `Ctrl/Cmd + L Ctrl/Cmd + 1 .. 9`.
- Added keyboard shortcut for previous workspace `Ctrl/Cmd + L Ctrl/Cmd + 0`.

### Changed
- Changed display name from `L13 Diff` to `Diff Folders`.
- Changed display name from `L13 Projects` to `Projects`.

## [0.13.2] - 2019-10-20

### Removed
- Removed gulpfile from vsix package.

## [0.13.1] - 2019-09-22

### Fixed
- Fixed save, rename and remove project if cache is used.

## [0.13.0] - 2019-09-22
- Initial release