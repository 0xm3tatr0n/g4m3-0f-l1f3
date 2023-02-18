## Color scheme ideas

number of pallettes (>4) selected based on type of `times`.

within given pallette, provide pos/neg range colors which will be selected based on number of births/deaths.

fork: use rainbow with same ranges for births/deaths but different bases (leaner scope).

example pallette

```solidity

string[] example = ["births0", "births1", "births2", "base", "deaths0", "deaths1", "deaths2"];


```

---

if alive && !changed: l0
if alive && changed && speed == 0: l0
if alive && changed && speed == 1: b0
if alive && changed && speed == 2: l0: animation born triangle
if alive && changed && speed == 3: l0: animation born square
if alive && changed && speed == 4: l0: animation born square (redundant)
if alive && changed && speed == 5: l0: animation born circle
if !alive && !changed && speed == 5: l0: animation born circle
if !alive && changed && representation == 0: d0
if !alive && changed && representation == 1: p0
if !alive && changed && representation == 2: p0 animation perished triangle
if !alive && changed && representation == 3: d0 animation perished square
if !alive && changed && representation == 4: d0 animation perished square (redundant)
if !alive && changed && representation == 5: d0 animation perished circle
