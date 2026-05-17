/**
 * Slim shape of a single record from `/public/data/operations_data.json`,
 * the artifact the public Track Record map and the kiosk dashboard read.
 *
 * The pipeline (scripts/python/generate_json.py) also publishes a FULL
 * version at `/public/data/operations_full.json` — every column from the
 * source xlsx, used today only by the staff diagnostic at
 * `/intranet/kiosk/datacheck`. The full schema is documented below; pull
 * any of those columns into the slim artifact (and add them here) if a
 * future filter or display needs them.
 *
 * ── Full schema (`operations_full.json`, 33 columns) ─────────────────
 *   Month, Year, Country, Location, Region,
 *   Operator, Wireline Company, Well,
 *   E&A / Dev, Land / Offshore, New Energy Wells, Mud,
 *   Open Hole /Cased Hole, Bit size / Csg size [inches],
 *   Depth [m], Temperature (degC), Deviation, Dif. Pressure [psi],
 *   DLS          [deg/30m], Main Application, Toolstring,
 *   Probe/Coring Bit Orientation, System, TLC Replacement Yes/No,
 *   PathFinder Run (Y/N), Thor Run (Y/N), Jar included in the Toolstring,
 *   Successful, Unsuccessful - Downhole Conditions,
 *   Unsuccessful - Wrong Setup, Jar Activation, Remarks, Subsystem
 *
 * ── Slim schema (`operations_data.json`, 6 columns) ──────────────────
 */
export interface JobRecord {
  Country: string;
  System: string;
  /** Finer identity within a family — e.g. "Helix" / "Rocker" inside
   *  "Focus - CH". May be "" when a historical record couldn't be
   *  classified. See scripts/python/normalization_config.py. */
  Subsystem: string;
  Year: number;
  Successful: number;
  "PathFinder Run (Y/N)": string; // <-- required for the year-wise chart
}