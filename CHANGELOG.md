# Change Log
All notable changes to the "Projects" extension will be documented in this file.

## [0.20.0] - 2021-04-18

### Added

- Enhanced context menu for [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff) with `Reveal in Finder/Explorer`, `Open in Integrated Terminal`, `Open Workspace`, `Open as Workspace` and `Add Folders to Workspace`.

## [0.19.0] - 2021-04-04

### Added

- Added tags for workspaces. Please read the description for tags.
- Added `l13Projects.showTagsInWorkspaces` for workspaces.
- Added `l13Projects.confirmDeleteTag` for deleting tags.
- Added `l13Projects.autoRemoveDeletedProjects` for reload workspaces or no cache.
- Added `Edit Workspaces...` for workspace groups in workspaces view.
- Added `l13Projects.workspaceDescriptionFormat` for workspaces.
- Added `l13Projects.tagDescriptionFormat` for tags.
- Added `l13Projects.groupDescriptionFormat` for groups.

### Changed

- Changed values for `l13Projects.sortWorkspacesBy` to lower case.
- Changed values for `l13Projects.initialFavoriteGroupsState` to lower case.
- Changed values for `l13Projects.initialWorkspaceGroupsState` to lower case.
- Changed value `Simple` to `category` for `l13Projects.sortWorkspacesBy`.

## [0.18.0] - 2021-03-21

### Added
- Added groups for favorites and workspaces.
- Added `l13Projects.initialFavoriteGroupsState` to set the initial state of the favorite groups.
- Added `l13Projects.confirmOpenMultipleWindows` for `Open All` and `Open All in New Windows`.
- Added `l13Projects.confirmDeleteFavorite` for deleting favorites.
- Added `l13Projects.confirmDeleteProject` for deleting projects.

### Changed
- Changed `l13Projects.initialWorkspacesGroupState` to `l13Projects.initialWorkspaceGroupsState`.
- Changed context group for `Open in Current Window` and `Open in New Window` in Visual Studio Code explorer view.
- Refactored extension.

### Fixed
- Fixed glob pattern for `*` and `?`.

## [0.17.0] - 2021-01-31

### Added
- Added detection for subfolders in a folder.
- Added project/workspace path to status bar.

## [0.16.0] - 2020-09-06

### Added
- Added icon color update to `Projects: Refresh Workspaces`.
- Added `Projects: Add Project Workspace` for Windows and Linux.

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
- Added `l13Projects.initialWorkspaceGroupsState` to set the initial state of the workspace groups.
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