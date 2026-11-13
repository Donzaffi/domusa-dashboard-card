
/*
 * DOMUSA Dashboard Card
 * Reads existing DOMUSA Bridge entities from Home Assistant.
 * No sensors, services, or backend polling are created by this card.
 */

const CARD_VERSION = "0.3.0";
const CARD_TYPE = "domusa-dashboard";
const UNIQUE_ID_PREFIX = "domusa_";

/*
 * IMPORTANT:
 * These are Bridge sensor UIDs, not MQTT/JSON payload keys.
 * Home Assistant unique IDs have this structure:
 * domusa_<cid>_<uid>
 */

const SENSOR_DEFINITIONS = [
  // System
  { uid: "operation_state", label: "Operating mode", group: "System", kind: "mode" },
  { uid: "heat_demand", label: "Heat pump demand", group: "System", kind: "boolean" },
  { uid: "zone1_demand", label: "Heating zone demand", group: "System", kind: "boolean" },
  { uid: "hotwater_active", label: "DHW active", group: "System", kind: "boolean" },
  { uid: "heating_circuit_pump", label: "Heating circuit pump C4", group: "System", kind: "boolean" },
  { uid: "sg_ready_c61", label: "SG Ready input 1", group: "System", kind: "boolean" },
  { uid: "sg_ready_c60", label: "SG Ready input 2", group: "System", kind: "boolean" },

  // Temperatures
  { uid: "outside_temperature", label: "Outdoor temperature", group: "Temperatures", unit: "°C" },
  { uid: "flow_temperature", label: "Water supply temperature", group: "Temperatures", unit: "°C" },
  { uid: "return_temperature", label: "Water return temperature", group: "Temperatures", unit: "°C" },
  { uid: "buffer_temperature", label: "Buffer temperature", group: "Temperatures", unit: "°C" },
  { uid: "dhw_temperature", label: "DHW temperature", group: "Temperatures", unit: "°C" },
  { uid: "evaporator_temperature", label: "Evaporator temperature", group: "Temperatures", unit: "°C" },
  { uid: "discharge_temperature", label: "Discharge temperature", group: "Temperatures", unit: "°C" },
  { uid: "suction_temperature", label: "Suction temperature", group: "Temperatures", unit: "°C" },
  { uid: "heat_exchanger_temperature", label: "Heat exchanger temperature", group: "Temperatures", unit: "°C" },
  { uid: "suction_evaporation_delta", label: "Suction / evaporation delta", group: "Temperatures", unit: "°C" },
  { uid: "evaporation_calculated", label: "Calculated evaporation temperature", group: "Temperatures", unit: "°C" },
  { uid: "condensation_calculated", label: "Calculated condensation temperature", group: "Temperatures", unit: "°C" },
  { uid: "ipm_temperature", label: "IPM module temperature", group: "Temperatures", unit: "°C" },

  // Setpoints
  { uid: "buffer_target", label: "Buffer target", group: "Setpoints", unit: "°C" },
  { uid: "heating_target", label: "Heating target", group: "Setpoints", unit: "°C" },
  { uid: "cooling_target", label: "Cooling target", group: "Setpoints", unit: "°C" },
  { uid: "dhw_target", label: "DHW target", group: "Setpoints", unit: "°C", kind: "target" },

  // Refrigerant circuit
  { uid: "compressor_frequency", label: "Compressor frequency", group: "Refrigerant circuit", unit: "Hz" },
  { uid: "compressor_frequency_target", label: "Compressor frequency target", group: "Refrigerant circuit", unit: "Hz" },
  { uid: "compressor_current", label: "Compressor current", group: "Refrigerant circuit", unit: "A" },
  { uid: "high_pressure", label: "High-side pressure", group: "Refrigerant circuit", unit: "bar" },
  { uid: "low_pressure", label: "Low-side pressure", group: "Refrigerant circuit", unit: "bar" },
  { uid: "eev_position", label: "EEV position", group: "Refrigerant circuit", unit: "°" },

  // Hydraulics
  { uid: "water_flow", label: "Water flow", group: "Hydraulics", unit: "L/min" },
  { uid: "pump_c1_speed", label: "Pump C1 speed", group: "Hydraulics", unit: "%" },
  { uid: "fan1_rpm", label: "Fan 1 speed", group: "Hydraulics", unit: "rpm" },
  { uid: "fan2_rpm", label: "Fan 2 speed", group: "Hydraulics", unit: "rpm" },

  // Electrical
  { uid: "input_voltage", label: "Input voltage", group: "Electrical", unit: "V" },
  { uid: "ipm_voltage", label: "IPM voltage", group: "Electrical", unit: "V" },
];

const MODE_LABELS = {
  "0": "Standby",
  "1": "Domestic hot water",
  "2": "Heating",
  "3": "Cooling",
  "Warten": "Standby",
  "Warmwasser": "Domestic hot water",
  "Heizen": "Heating",
  "Kühlen": "Cooling",
};

const GROUP_ORDER = [
  "System",
  "Temperatures",
  "Setpoints",
  "Refrigerant circuit",
  "Hydraulics",
  "Electrical",
];

class DomusaDashboardCard extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this._hass = undefined;
    this._config = {};
    this._registryConnection = undefined;
    this._registryPromise = undefined;
    this._entitiesByDevice = {};
    this._loading = false;
    this._error = "";

    // Default view
    this._activeView = "hydraulic";
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Invalid DOMUSA Dashboard configuration.");
    }

    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;

    if (hass && hass.connection && hass.connection !== this._registryConnection) {
      this._registryConnection = hass.connection;
      this._registryPromise = undefined;
      this._entitiesByDevice = {};
      this._error = "";

      this._loadEntityRegistry();
    } else {
      this._render();
    }
  }

  getCardSize() {
    return 10;
  }

  async _loadEntityRegistry() {
    if (!this._hass || !this._hass.callWS || this._loading) {
      return;
    }

    this._loading = true;
    this._error = "";
    this._render();

    try {
      this._registryPromise = this._hass.callWS({
        type: "config/entity_registry/list",
      });

      const entries = await this._registryPromise;

      this._entitiesByDevice = this._mapBridgeEntities(entries);
      this._error = "";
    } catch (error) {
      this._error = error && error.message
        ? error.message
        : "The Home Assistant entity registry could not be read.";

      this._entitiesByDevice = {};
    } finally {
      this._loading = false;
      this._render();
    }
  }

  /*
   * Maps:
   * domusa_<cid>_<uid>
   *
   * Example:
   * domusa_12345_evaporator_temperature
   *
   * The cid keeps different heat pumps separate.
   */
  _mapBridgeEntities(entries) {
    const mapped = {};

    if (!Array.isArray(entries)) {
      return mapped;
    }

    for (const entry of entries) {
      if (
        !entry ||
        !entry.unique_id ||
        !entry.entity_id ||
        entry.disabled_by
      ) {
        continue;
      }

      const uniqueId = String(entry.unique_id);

      if (!uniqueId.startsWith(UNIQUE_ID_PREFIX)) {
        continue;
      }

      const definition = SENSOR_DEFINITIONS.find((item) =>
        uniqueId.endsWith(`_${item.uid}`)
      );

      if (!definition) {
        continue;
      }

      const suffix = `_${definition.uid}`;
      const deviceId = uniqueId.slice(
        UNIQUE_ID_PREFIX.length,
        -suffix.length
      );

      if (!deviceId) {
        continue;
      }

      if (!mapped[deviceId]) {
        mapped[deviceId] = {};
      }

      mapped[deviceId][definition.uid] = entry.entity_id;
    }

    return mapped;
  }

  _getState(deviceId, definition) {
    const entityId = this._entitiesByDevice[deviceId]?.[definition.uid];

    if (!entityId || !this._hass?.states) {
      return undefined;
    }

    return this._hass.states[entityId];
  }

  _formatValue(stateObj, definition) {
    if (!stateObj) {
      return "Not found";
    }

    const raw = stateObj.state;

    if (
      raw === "unknown" ||
      raw === "unavailable" ||
      raw === null ||
      raw === undefined
    ) {
      return raw === "unavailable" ? "Unavailable" : "Unknown";
    }

    if (definition.kind === "mode") {
      return MODE_LABELS[String(raw)] || String(raw);
    }

    if (definition.kind === "boolean") {
      if (["on", "true", "1"].includes(String(raw).toLowerCase())) {
        return "On";
      }

      if (["off", "false", "0"].includes(String(raw).toLowerCase())) {
        return "Off";
      }

      return String(raw);
    }

    const numeric = Number(raw);

    if (!Number.isFinite(numeric)) {
      return String(raw);
    }

    // The DHW target uses -255 to indicate that no target is set.
    if (definition.kind === "target" && numeric === -255) {
      return "Not set";
    }

    // The Bridge value_template has already processed the value.
    // Do not apply additional pressure scaling here.
    const value = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 1,
    }).format(numeric);

    const unit =
      definition.unit ||
      stateObj.attributes?.unit_of_measurement ||
      "";

    return unit ? `${value} ${unit}` : value;
  }

  _statusClass(stateObj, definition) {
    if (
      !stateObj ||
      stateObj.state === "unknown" ||
      stateObj.state === "unavailable"
    ) {
      return "muted";
    }

    if (definition.kind === "boolean") {
      return ["on", "true", "1"].includes(
        String(stateObj.state).toLowerCase()
      )
        ? "active"
        : "";
    }

    if (definition.kind === "mode") {
      const state = String(stateObj.state);

      return ["0", "Warten", "Standby"].includes(state)
        ? "muted"
        : "active";
    }

    return "";
  }

  _getFormattedValue(deviceId, uid) {
    const definition = SENSOR_DEFINITIONS.find(
      (item) => item.uid === uid
    );

    if (!definition) {
      return "Not configured";
    }

    return this._formatValue(
      this._getState(deviceId, definition),
      definition
    );
  }

  _isOn(deviceId, uid) {
    const stateObj = this._getState(deviceId, { uid });

    if (!stateObj) {
      return false;
    }

    return ["on", "true", "1"].includes(
      String(stateObj.state).toLowerCase()
    );
  }

  _renderDiagramMetric(deviceId, uid, label) {
    return `
      <div class="diagram-metric">
        <div class="diagram-metric-label">
          ${this._escapeHtml(label)}
        </div>
        <div class="diagram-metric-value">
          ${this._escapeHtml(this._getFormattedValue(deviceId, uid))}
        </div>
      </div>
    `;
  }

  _renderHydraulicView(deviceId) {
    const pumpOn = this._isOn(deviceId, "heating_circuit_pump");
    const pumpClass = pumpOn ? "pump-active" : "pump-inactive";
    const flowClass = pumpOn ? "flow-active" : "";

    return `
      <div class="diagram-panel">
        <div class="diagram-title">
          Hydraulischer Heizwasserkreislauf
        </div>

        <div class="diagram-subtitle">
          Wärmepumpe · Pufferspeicher · Heizkreispumpe C4
        </div>

        <svg
          class="hydraulic-svg"
          viewBox="0 0 900 350"
          role="img"
          aria-label="Hydraulischer Heizwasserkreislauf mit Pufferspeicher und Heizkreispumpe C4"
        >
          <defs>
            <marker
              id="supply-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#e45b42"/>
            </marker>

            <marker
              id="return-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#398bd5"/>
            </marker>
          </defs>

          <!-- Supply: heat pump to flow sensor, buffer, C4 and heating circuit -->
          <path
            class="flow-line supply ${flowClass}"
            d="M135 105 H240 H335 H475 H590 H780 V220"
            marker-end="url(#supply-arrow)"
          />

          <!-- Return: heating circuit through return sensor to heat pump -->
          <path
            class="flow-line return ${flowClass}"
            d="M780 220 H240 H135 V145"
            marker-end="url(#return-arrow)"
          />

          <!-- Heat pump -->
          <rect
            class="component"
            x="15" y="70" width="120" height="100" rx="12"
          />
          <text x="75" y="112" text-anchor="middle" font-size="15">
            Wärmepumpe
          </text>
          <text class="small-label" x="75" y="136" text-anchor="middle">
            DOMUSA
          </text>

          <!-- Flow sensor -->
          <circle cx="240" cy="105" r="13" fill="#e45b42"/>
          <text x="240" y="75" text-anchor="middle" font-size="13">
            Vorlauf
          </text>
          <text class="small-label" x="240" y="145" text-anchor="middle">
            s_ida_hp_c08
          </text>

          <!-- Buffer tank -->
          <rect
            class="component"
            x="335" y="55" width="140" height="100" rx="15"
          />
          <path
            d="M350 105 H460"
            stroke="var(--divider-color)"
            stroke-width="2"
          />
          <text x="405" y="91" text-anchor="middle" font-size="15">
            Pufferspeicher
          </text>
          <text class="small-label" x="405" y="130" text-anchor="middle">
            Buffer
          </text>

          <!-- C4 heating circuit pump -->
          <circle
            cx="590"
            cy="105"
            r="30"
            class="${pumpClass}"
            stroke-width="3"
          />
          <path
            d="M578 91 L604 105 L578 119 Z"
            fill="var(--card-background-color)"
          />
          <text x="590" y="58" text-anchor="middle" font-size="14">
            Pumpe C4
          </text>
          <text class="small-label" x="590" y="153" text-anchor="middle">
            ${pumpOn ? "EIN" : "AUS"}
          </text>

          <!-- Heating circuit -->
          <rect
            class="component"
            x="700" y="220" width="160" height="75" rx="12"
          />
          <text x="780" y="250" text-anchor="middle" font-size="15">
            Heizkreis
          </text>
          <text class="small-label" x="780" y="273" text-anchor="middle">
            Wärmeabgabe
          </text>

          <!-- Return sensor -->
          <circle cx="240" cy="220" r="13" fill="#398bd5"/>
          <text x="240" y="260" text-anchor="middle" font-size="13">
            Rücklauf
          </text>
          <text class="small-label" x="240" y="282" text-anchor="middle">
            s_ret_hp_c07
          </text>

          <text class="small-label" x="450" y="320" text-anchor="middle">
            Fließrichtung im Heizwasserkreislauf
          </text>
        </svg>

        <div class="diagram-metrics">
          ${this._renderDiagramMetric(
            deviceId,
            "flow_temperature",
            "Wasservorlauf · vor Puffer"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "buffer_temperature",
            "Puffertemperatur"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "return_temperature",
            "Wasserrücklauf · vor WP"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "water_flow",
            "Wasserdurchfluss · WP"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "pump_c1_speed",
            "Interne Pumpendrehzahl C1"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "heating_circuit_pump",
            "Heizkreispumpe C4"
          )}
        </div>

        <div class="diagram-note">
          Die animierte Fließlinie wird anhand des C4-Status geschaltet.
          Der angezeigte Wasserdurchfluss ist der Bridge-Messwert der
          Wärmepumpe und kein separat gemessener Durchfluss hinter C4.
        </div>
      </div>
    `;
  }

  _renderInternalView(deviceId) {
    return `
      <div class="diagram-panel">
        <div class="diagram-title">
          Interner Arbeitsstatus
        </div>

        <div class="diagram-subtitle">
          Schematische Funktionsübersicht nach dem DOMUSA-Displayfoto.
          Keine maßstabsgetreue technische Zeichnung.
        </div>

        <svg
          class="internal-svg"
          viewBox="0 0 800 300"
          role="img"
          aria-label="Schematische interne Komponenten der Wärmepumpe"
        >
          <!-- Schematic refrigerant circuit -->
          <path
            d="M145 105 H300 V70 H470 V105 H650"
            fill="none"
            stroke="#e45b42"
            stroke-width="7"
            stroke-linecap="round"
          />

          <path
            d="M650 190 H470 V235 H300 V190 H145"
            fill="none"
            stroke="#e69a3a"
            stroke-width="7"
            stroke-linecap="round"
          />

          <!-- Evaporator -->
          <rect
            class="component"
            x="35" y="80" width="115" height="140" rx="12"
          />
          <path
            d="M55 105 C125 105 60 125 130 125
               M55 145 C125 145 60 165 130 165
               M55 185 C125 185 60 205 130 205"
            fill="none"
            stroke="var(--secondary-text-color)"
            stroke-width="3"
          />
          <text x="92" y="250" text-anchor="middle" font-size="14">
            Verdampfer
          </text>

          <!-- Compressor -->
          <rect
            class="component"
            x="300" y="105" width="120" height="95" rx="12"
          />
          <text x="360" y="145" text-anchor="middle" font-size="15">
            Verdichter
          </text>
          <text class="small-label" x="360" y="170" text-anchor="middle">
            ${this._escapeHtml(
              this._getFormattedValue(deviceId, "compressor_frequency")
            )}
          </text>

          <!-- Expansion valve -->
          <rect
            class="component"
            x="465" y="190" width="55" height="45" rx="8"
          />
          <path
            d="M475 200 L510 225 M510 200 L475 225"
            stroke="var(--secondary-text-color)"
            stroke-width="2"
          />
          <text class="small-label" x="492" y="260" text-anchor="middle">
            EEV
          </text>

          <!-- Heat exchanger -->
          <rect
            class="component"
            x="650" y="80" width="115" height="140" rx="12"
          />
          <path
            d="M670 105 C740 105 675 125 745 125
               M670 145 C740 145 675 165 745 165
               M670 185 C740 185 675 205 745 205"
            fill="none"
            stroke="var(--secondary-text-color)"
            stroke-width="3"
          />
          <text x="707" y="250" text-anchor="middle" font-size="14">
            Wärmetauscher
          </text>
        </svg>

        <div class="diagram-metrics">
          ${this._renderDiagramMetric(
            deviceId,
            "evaporator_temperature",
            "Verdampfertemperatur"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "suction_temperature",
            "Sauggastemperatur"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "discharge_temperature",
            "Heißgastemperatur"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "heat_exchanger_temperature",
            "Wärmetauschertemperatur"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "high_pressure",
            "Hochdruck"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "low_pressure",
            "Niederdruck"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "compressor_frequency",
            "Verdichterfrequenz"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "compressor_current",
            "Verdichterstrom"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "fan1_rpm",
            "Ventilator 1"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "fan2_rpm",
            "Ventilator 2"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "water_flow",
            "Wasserdurchfluss"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "flow_temperature",
            "Wasservorlauf"
          )}

          ${this._renderDiagramMetric(
            deviceId,
            "return_temperature",
            "Wasserrücklauf"
          )}
        </div>

        <div class="diagram-note">
          Die Grafik ist eine vereinfachte Funktionsdarstellung.
          Sie ersetzt nicht den originalen DOMUSA-Schalt- oder
          Kältemittelplan.
        </div>
      </div>
    `;
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    const devices = Object.keys(this._entitiesByDevice);

    const styles = `
      :host {
        display: block;
        color: var(--primary-text-color);
      }

      ha-card {
        overflow: hidden;
        border-radius: var(--ha-card-border-radius, 18px);
        background: var(--ha-card-background, var(--card-background-color));
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 20px 20px 14px;
      }

      .heading {
        min-width: 0;
      }

      .title {
        font-size: 1.15rem;
        font-weight: 650;
        letter-spacing: .01em;
      }

      .subtitle {
        margin-top: 4px;
        color: var(--secondary-text-color);
        font-size: .82rem;
      }

      .version {
        color: var(--secondary-text-color);
        font-size: .68rem;
        white-space: nowrap;
      }

      .content {
        padding: 0 20px 20px;
      }

      .device + .device {
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid var(--divider-color);
      }

      .device-title {
        margin: 0 20px 12px;
        color: var(--secondary-text-color);
        font-size: .78rem;
        font-weight: 650;
        letter-spacing: .09em;
        text-transform: uppercase;
      }

      .group + .group {
        margin-top: 18px;
      }

      .group-title {
        margin: 0 0 9px;
        font-size: .88rem;
        font-weight: 600;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(min(100%, 145px), 1fr)
        );
        gap: 9px;
      }

      .metric {
        min-width: 0;
        padding: 12px 13px;
        border: 1px solid var(--divider-color);
        border-radius: 13px;
        background: var(
          --secondary-background-color,
          rgba(127,127,127,.06)
        );
      }

      .label {
        color: var(--secondary-text-color);
        font-size: .75rem;
        line-height: 1.35;
      }

      .value {
        margin-top: 7px;
        font-size: 1.12rem;
        font-weight: 650;
        line-height: 1.25;
        overflow-wrap: anywhere;
      }

      .value.active {
        color: var(--success-color, var(--primary-color));
      }

      .value.muted {
        color: var(--secondary-text-color);
        font-size: .96rem;
        font-weight: 550;
      }

      .message {
        padding: 18px 20px 20px;
        color: var(--secondary-text-color);
        font-size: .9rem;
        line-height: 1.5;
      }

      .error {
        color: var(--error-color);
      }

      .retry {
        margin-top: 12px;
        padding: 7px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 9px;
        background: transparent;
        color: var(--primary-text-color);
        font: inherit;
        cursor: pointer;
      }

      /* View navigation */

      .view-tabs {
        display: flex;
        gap: 8px;
        padding: 0 20px 16px;
        overflow-x: auto;
      }

      .view-tab {
        padding: 9px 13px;
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        background: transparent;
        color: var(--secondary-text-color);
        font: inherit;
        font-size: .82rem;
        cursor: pointer;
        white-space: nowrap;
      }

      .view-tab.active {
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border-color: var(--primary-color);
      }

      /* Diagram panels */

      .diagram-panel {
        margin: 0 20px 20px;
        padding: 14px;
        border: 1px solid var(--divider-color);
        border-radius: 15px;
        background: var(--secondary-background-color);
      }

      .diagram-title {
        margin-bottom: 5px;
        font-size: .95rem;
        font-weight: 650;
      }

      .diagram-subtitle {
        margin-bottom: 14px;
        color: var(--secondary-text-color);
        font-size: .75rem;
      }

      .hydraulic-svg,
      .internal-svg {
        display: block;
        width: 100%;
        height: auto;
      }

      .hydraulic-svg text,
      .internal-svg text {
        fill: var(--primary-text-color);
        font-family: inherit;
      }

      .hydraulic-svg .small-label,
      .internal-svg .small-label {
        fill: var(--secondary-text-color);
        font-size: 12px;
      }

      .hydraulic-svg .component,
      .internal-svg .component {
        fill: var(--card-background-color);
        stroke: var(--divider-color);
        stroke-width: 2;
      }

      .hydraulic-svg .flow-line {
        fill: none;
        stroke-width: 7;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .hydraulic-svg .supply {
        stroke: #e45b42;
      }

      .hydraulic-svg .return {
        stroke: #398bd5;
      }

      .hydraulic-svg .flow-active {
        stroke-dasharray: 12 10;
        animation: hydraulic-flow 1.2s linear infinite;
      }

      .hydraulic-svg .pump-active {
        stroke: var(--success-color, #16a34a);
        fill: var(--success-color, #16a34a);
      }

      .hydraulic-svg .pump-inactive {
        stroke: var(--secondary-text-color);
        fill: var(--secondary-background-color);
      }

      .diagram-metrics {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
        margin-top: 14px;
      }

      .diagram-metric {
        min-width: 0;
        padding: 11px;
        border: 1px solid var(--divider-color);
        border-radius: 11px;
      }

      .diagram-metric-label {
        color: var(--secondary-text-color);
        font-size: .73rem;
      }

      .diagram-metric-value {
        margin-top: 5px;
        font-size: 1.05rem;
        font-weight: 650;
        overflow-wrap: anywhere;
      }

      .diagram-note {
        margin-top: 12px;
        color: var(--secondary-text-color);
        font-size: .72rem;
        line-height: 1.45;
      }

      @keyframes hydraulic-flow {
        to {
          stroke-dashoffset: -44;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .hydraulic-svg .flow-active {
          animation: none;
        }
      }

      @media (max-width: 420px) {
        .header {
          padding: 16px 16px 12px;
        }

        .content {
          padding: 0 16px 16px;
        }

        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .diagram-panel {
          margin-left: 12px;
          margin-right: 12px;
          padding: 10px;
        }

        .view-tabs {
          padding-left: 12px;
          padding-right: 12px;
        }

        .device-title {
          margin-left: 12px;
          margin-right: 12px;
        }
      }
    `;

    let body = "";

    if (this._loading) {
      body = `
        <div class="message">
          Discovering DOMUSA Bridge entities…
        </div>
      `;
    } else if (this._error) {
      body = `
        <div class="message">
          <div class="error">
            Could not discover DOMUSA entities.
          </div>
          <div>${this._escapeHtml(this._error)}</div>
          <button class="retry" type="button">
            Retry discovery
          </button>
        </div>
      `;
    } else if (devices.length === 0) {
      body = `
        <div class="message">
          No DOMUSA Bridge entities were found in the Home Assistant
          entity registry. Check that the Bridge sensors are enabled
          and that their unique IDs use the <code>domusa_</code> prefix.
        </div>
      `;
    } else {
      body = `
        <div class="content">
          ${devices.map((deviceId) => this._renderDevice(deviceId)).join("")}
        </div>
      `;
    }

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>

      <ha-card>
        <div class="header">
          <div class="heading">
            <div class="title">DOMUSA Dashboard</div>
            <div class="subtitle">Heat pump overview</div>
          </div>

          <div class="version">v${CARD_VERSION}</div>
        </div>

        ${body}
      </ha-card>
    `;

    const retry = this.shadowRoot.querySelector(".retry");

    if (retry) {
      retry.addEventListener("click", () => {
        this._loadEntityRegistry();
      });
    }

    this.shadowRoot.querySelectorAll(".view-tab").forEach((button) => {
      button.addEventListener("click", () => {
        this._activeView = button.dataset.view;
        this._render();
      });
    });
  }

  _renderDevice(deviceId) {
    const groups = GROUP_ORDER.map((groupName) => {
      const definitions = SENSOR_DEFINITIONS.filter(
        (item) => item.group === groupName
      );

      const availableDefinitions = definitions.filter(
        (item) => this._entitiesByDevice[deviceId]?.[item.uid]
      );

      if (!availableDefinitions.length) {
        return "";
      }

      const metrics = availableDefinitions.map((definition) => {
        const stateObj = this._getState(deviceId, definition);
        const value = this._formatValue(stateObj, definition);
        const statusClass = this._statusClass(stateObj, definition);

        return `
          <div class="metric">
            <div class="label">
              ${this._escapeHtml(definition.label)}
            </div>

            <div class="value ${statusClass}">
              ${this._escapeHtml(value)}
            </div>
          </div>
        `;
      }).join("");

      return `
        <section class="group">
          <h3 class="group-title">
            ${this._escapeHtml(groupName)}
          </h3>

          <div class="grid">
            ${metrics}
          </div>
        </section>
      `;
    }).join("");

    let activeContent = "";

    if (this._activeView === "internal") {
      activeContent = this._renderInternalView(deviceId);
    } else if (this._activeView === "values") {
      activeContent = `
        <div class="content">
          ${groups}
        </div>
      `;
    } else {
      activeContent = this._renderHydraulicView(deviceId);
    }

    return `
      <section class="device">
        <h2 class="device-title">
          DOMUSA · ${this._escapeHtml(deviceId)}
        </h2>

        <div class="view-tabs">
          <button
            class="view-tab ${this._activeView === "internal" ? "active" : ""}"
            data-view="internal"
            type="button"
          >
            Arbeitsstatus
          </button>

          <button
            class="view-tab ${this._activeView === "hydraulic" ? "active" : ""}"
            data-view="hydraulic"
            type="button"
          >
            Heizwasserkreislauf
          </button>

          <button
            class="view-tab ${this._activeView === "values" ? "active" : ""}"
            data-view="values"
            type="button"
          >
            Alle Messwerte
          </button>
        </div>

        ${activeContent}
      </section>
    `;
  }

  _escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, DomusaDashboardCard);
}

window.customCards = window.customCards || [];

if (!window.customCards.some((card) => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: "DOMUSA Dashboard",
    description: "Live overview for DOMUSA heat pumps using existing Bridge entities.",
    preview: false,
  });
}

console.info(
  `%c DOMUSA Dashboard %c ${CARD_VERSION} `,
  "color: white; background: #176b87; font-weight: bold;",
  "color: #176b87; background: transparent; font-weight: bold;"
);
