# Public Evaluation Snapshots

These CSV snapshots are cached for the local **Evaluate tool** demo so benchmark
runs do not depend on network access.

Sources:

- `plotly_diabetes/diabetes.csv` from Plotly datasets:
  <https://github.com/plotly/datasets/blob/master/diabetes.csv>
- `plotly_manufacturing/cost_output_defective.csv` from Plotly datasets:
  <https://github.com/plotly/datasets/blob/master/cost_output_defective.csv>

License: Plotly datasets are distributed under the MIT license. The local copy
of the license is stored in `PLOTLY_DATASETS_LICENSE.txt`.

The evaluation generators derive small local demo datasets from these snapshots
and seed deterministic data-quality faults so VSF output can be compared against
known ground truth.
