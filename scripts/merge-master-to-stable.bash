#!/bin/bash
set -veuxo pipefail

current=master
target=stable

git checkout $target

# We want the first-parent ancestor line of the stable branch to
# only include green commits.
if (( "$(git rev-list $target..$current --count)" <= 1 )); then
  # If we're only adding one commit, we can fast-forward it directly.
  git merge --ff --no-edit master
else
  # Otherwise, we need to create a merge commit.
  git merge --no-ff master -m "$(git log stable..master --format="format:%B%n")"
fi

# fast-forward master to match
git checkout $current
git merge --ff $target

# Not an error because it probably just means another non-generated commit has been
# pushed, which is fine and shouldn't affect the exit status of this check.
git push origin $target $current || echo "WARNING: Failed to push!"
