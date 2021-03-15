# Projects

Manage your workspaces and projects in Visual Studio Code.

![Projects](images/previews/preview.png)

## What's new in Projects 0.18.0

- Added groups for favorites and workspaces.
- Added `l13Projects.initialFavoriteGroupsState` to set the initial state of the favorite groups.
- Changed context group for `Open in Current Window` and `Open in New Window` in VS Code explorer view.

## Index

1. [Features](#features)
1. [Available Commands](#available-commands)
1. [Available Settings](#available-settings)
1. [Mouse and Keyboard Shortcuts](#mouse-and-keyboard-shortcuts)
1. [Recommended Extensions](#recommended-extensions)

## Features

* Supports extension [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff)
* Add folders and workspaces to the project list.
* Save the current folder or workspace in the project list.
* Auto detects Git repositories, VS Code folders and VS Code workspaces.
* Save auto detected Git repositories, VS Code folders and VS Code workspaces in the project list.
* Add projects, Git repositories, VS Code folders and VS Code workspaces to favorites.
* Open and pick a (favorite) folder, workspace or project with the quick menu.
* Open a folder, workspace or project in  the current or a new window in VS Code Explorer or Projects.
* Reveal a folder or workspace in the Finder/Explorer.
* Open a project, Git repository, VS Code folder or VS Code workspace in the Terminal.
* Delete or rename a favorite or project.
* Status bar shows current workspace name and opens the current folder or workspace in the Finder/Explorer.
* Cache detected folders and workspaces between sessions.
* Sort workspaces by name, category or type.
* Add custom groups to organize your workspaces.
* Assign a workspace or a group to a slot to open it with a keyboard shortcut.
* Select a color for a project which also changes the status bar color for the workspace.

### Workspaces

![Projects](images/previews/preview-workspaces.png)

### Quick Pick and Keyboard Shortcuts

![Projects Quick Menu](images/previews/preview-quick-menu.png)

### Status Bar Colors

![Projects Colors](images/previews/preview-colors.png)

![Projects Status Bar Colors](images/previews/preview-statusbar.png)

### Supports the Extension [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff)

![Diff Folders](images/previews/preview-diff-folders.png)

### Icons

![Projects Icons](images/previews/preview-icons.png)

Priority of icons and labels for saved projects and detected folders and workspaces.

1. project / project-workspace
1. git-repository
1. vscode / vscode-workspace
1. subfolder

## Available Commands

* `Projects: Save Project` - Save the detected folder or workspace in the project list.
* `Projects: Delete All Projects` - Delete all saved projects in the project list.
* `Projects: Delete All Favorites` - Delete all favorites.
* `Projects: Open Favorite Workspace` - Open the quick menu and pick a favorite.
* `Projects: Open Workspace` - Open the quick menu and pick a project.
* `Projects: Slot 1 .. 9` - Open a workspace assigned to a slot.
* `Projects: Clear Slot` - Clear a slot.
* `Projects: Clear All Slots` - Clear all slots.
* `Projects: Go to previous Workspace` - Open the previous active workspace.
* `Refresh` - Refresh all detected folders and workspaces.

macOS

* `Add Project` - Add folders and workspaces to the project list by dialog.

Widnows and Linux

* `Add Project` - Add folders to the project list by dialog.
* `Add Project Workspace` - Add workspaces to the project list by dialog.

## Available Settings

* `l13Projects.openInNewWindow` - If true click on project or click in quick menu opens folder or workspace in new window. Default value is false.
* `l13Projects.useCacheForDetectedProjects` - If true detected folders and workspaces will be stored  between window sessions. Default value is false.
* `l13Projects.git.folders` - The folders to search for Git repositories.
* `l13Projects.git.maxDepthRecursion` - The maximum depth of folder recursion for Git repositories.
* `l13Projects.git.ignore` - The folders which should be ignored.
* `l13Projects.vsCode.folders` - The folders to search for VS Code projects.
* `l13Projects.vsCode.maxDepthRecursion` - The maximum depth of folder recursion for VS Code projects.
* `l13Projects.vsCode.ignore` - The folders which should be ignored.
* `l13Projects.workspace.folders` - The folders to search for VS Code workspaces.
* `l13Projects.workspace.maxDepthRecursion` - The maximum depth of folder recursion for VS Code workspaces.
* `l13Projects.workspace.ignore` - The folders which should be ignored.
* `l13Projects.subfolder.folders` - The folders to search for subfolders.
* `l13Projects.subfolder.ignore` - The folders which should be ignored.
* `l13Projects.sortWorkspacesBy` - Sort workspaces by name, category or type. Custom groups are always at the top of the tree view. If a project, folder or workspace is part of a custom group, it does not appear in the auto sorted groups anymore.
	* `Name` - (default) Sort all workspaces by name.
	* `Simple` - Group all workspaces by category.
	* `Type` - Group all workspaces by type.
* `l13Projects.initialFavoriteGroupsState` - Set the initial state of a favorite group.
	* `Remember` - (default) Remember the collpased and expanded state of each group.
	* `Collapsed` - Show all groups collapsed at start.
	* `Expanded` - Show all groups expanded at start.
* `l13Projects.initialWorkspaceGroupsState` - Set the initial state of a workspace group.
	* `Remember` - (default) Remember the collpased and expanded state of each group.
	* `Collapsed` - Show all groups collapsed at start.
	* `Expanded` - Show all groups expanded at start.

## Mouse and Keyboard Shortcuts

### Global

#### macOS

* `Cmd + L Cmd + P` - Open the projects view.
* `Cmd + Alt + P` - Open the quick menu to pick a favorite.
* `Cmd + Alt + Shift + P` - Open the quick menu to pick a project.
* `Cmd + L Cmd + 1 .. 9` - Open a workspace in the slot 1 - 9.
* `Cmd + L Cmd + 0` - Open the previous active workspace.

#### Windows / Linux

* `Ctrl + L Ctrl + P` - Open the projects view.
* `Ctrl + Alt + P` - Open the quick menu to pick a favorite.
* `Ctrl + Alt + Shift + P` - Open the quick menu to pick a project.
* `Ctrl + L Ctrl + 1 .. 9` - Open a workspace in the slot 1 - 9.
* `Ctrl + L Ctrl + 0` - Open the previous active workspace.

If the key bindings don't work, please check `Preferences -> Keyboard Shortcuts`.

### Favorites

* `Click` - Open a favorite folder, workspace or project. If `l13Projects.openInNewWindow` is true the project opens in a new window.

### Favorites Context Icons

#### All Platforms

* `New Favorite Group` - Add a new favorite group.
* `Collapse All` - Collapse all groups.

### Favorites Context menu

* `Open` - Open the favorite project in the current window. Ignores `l13Projects.openInNewWindow`.
* `Open in new Window` - Open the favorite project in a new window. Ignores `l13Projects.openInNewWindow`.
* `Add to Group` - Add a project, repository or workspace to a favorite group.
* `Open in Terminal` - Opens the favorite project in the VS Code terminal.
* `Assign to Slot` - Assign the folder, workspace or project to slot 1 - 9 to open it with a keyboard shortcut.
* `Select for Compare` - Select a folder, workspace or project for a comparison. Requires [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff).
* `Compare with Selected` - Compare the folder, workspace or project with the current selection. Requires [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff).
* `Compare with Workspace` - Compares the favorite project with the current workspace. Requires [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff).
* `Open in Diff Folders` - Opens the favorite project in Diff Folders. Requires [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff).
* `Copy Path` - Copy the path of the project, repository or workspace to the clipboard.
* `Remove from Group` - Remove a project, repository or workspace from a favorite group.
* `Rename` - Change the name of the favorite project.
* `Delete` - Remove the project, repository or workspace from favorites.

#### macOS

* `Reveal in Finder` - Opens the favorite project in the finder.

#### Windows

* `Reveal in Explorer` - Opens the favorite project in the explorer.

#### Linux

* `Open Containing Folder` - Opens the favorite project in the file manager.

### Favorite Groups Context Menu

* `Open All` - Open all favorites in a group at once in the current and new windows. Ignores `l13Projects.openInNewWindow`.
* `Open All in New Windows` - Open all favorites in a group at once in new windows. Ignores `l13Projects.openInNewWindow`.
* `Open as Workspace` - Open all favorites in a group as a single workspace.
* `Assign to Slot` - Assign the workspace group to slot 1 - 9 to open all with a keyboard shortcut.
* `Add Folders to Workspace` - Add all favorites in a group to the current workspace.
* `Rename` - Rename a favorite group.
* `Delete` - Delete a favorite group or a favorite group and all favorites in a group.

### Workspaces

* `Click` - Open a folder, workspace or project. If `l13Projects.openInNewWindow` is true the project opens in a new window.

### Workspaces Context Icons

#### All Platforms

* `New Workspace Group` - Add a new workspace group.
* `Refresh` - Refresh workspace and favorite list.
* `Collapse All` - Collapse all groups.

#### macOS

* `Add Project` - Add a folder or workspace file as project to the workspace list.

#### Windows / Linux

* `Add Project` - Add a folder as project to the workspace list.
* `Add Project Workspace` - Add a workspace file as project workspace to the workspace list.

### Workspaces Context menu

* `Open` - Open the folder, workspace or project in the current window. Ignores `l13Projects.openInNewWindow`.
* `Open in new Window` - Open the folder, workspace or project in a new window. Ignores `l13Projects.openInNewWindow`.
* `Save Project` - Save the folder or workspace as a project.
* `Add to Favorites` - Add the folder, workspace or project to favorites.
* `Open in Integrated Terminal` - Open the folder, workspace or project in the terminal.
* `Add to Group` - Add a project, repository or workspace to a workspace group.
* `Assign to Slot` - Assign the folder, workspace or project to slot 1 - 9 to open it with a keyboard shortcut.
* `Select Status Bar Color` - Select a color for a project. The color also appears in the status bar.
* `Select for Compare` - Select a folder, workspace or project for a comparison. Requires [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff).
* `Compare with Selected` - Compare the folder, workspace or project with the current selection. Requires [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff).
* `Compare with Workspace` - Compares the folder, workspace or project with the current workspace. Requires [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff).
* `Open in Diff Folders` - Opens the folder, workspace or project in Diff Folders. Requires [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff).
* `Copy Path` - Copy the path of the project, repository or workspace to the clipboard.
* `Remove from Group` - Remove a project, repository or workspace from a workspace group.
* `Rename` - Change the name of a project.
* `Delete` - Delete the project.

#### macOS

* `Reveal in Finder` - Opens the folder or VS Code workspace file in the Finder.

#### Windows

* `Reveal in Explorer` - Opens the folder or VS Code workspace file in the Explorer.

#### Linux

* `Open Containing Folder` - Opens the folder or VS Code workspace file in the file manager.

### Workspace Groups Context Menu

* `Open All` - Open all workspaces in a group at once in the current and new windows. Ignores `l13Projects.openInNewWindow`.
* `Open All in New Windows` - Open all workspaces in a group at once in new windows. Ignores `l13Projects.openInNewWindow`.
* `Open as Workspace` - Open all workspaces in a group as a single workspace.
* `Add to Favorites` - Add the workspace group and all its workspaces to favorites.
* `Assign to Slot` - Assign the workspace group to slot 1 - 9 to open all with a keyboard shortcut.
* `Add Folders to Workspace` - Add all workspaces in a group to the current workspace.
* `Rename` - Rename a workspace group.
* `Delete` - Delete a workspace group.

### Quick Menu for Favorites

* `Click` - Open a favorite folder, workspace or project. If `l13Projects.openInNewWindow` is true the project opens in a new window.

### Quick Menu for Projects

* `Click` - Open a folder, workspace or project. If `l13Projects.openInNewWindow` is true the project opens in a new window.

### Statusbar

* `Click` - Reveal the current folder or workspace file in the Finder/Explorer.

### Visual Studio Code Explorer Context Menu

* `Open in current Window` - Opens the selected file or folder in the current VS Code Window.
* `Open in new Window` - Opens the selected file or folder in a new VS Code Window.

## Recommended Extensions

- [Diff Folders](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-diff)
- [Extension Pack](https://marketplace.visualstudio.com/items?itemName=L13RARY.l13-extension-pack)