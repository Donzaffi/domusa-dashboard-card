
/*
 * DOMUSA Dashboard Card
 * Version 0.4.2
 *
 * Reads existing DOMUSA Bridge entities from Home Assistant.
 * No sensors, services, MQTT messages, or backend polling are created.
 * This card is strictly read-only.
 */

const CARD_VERSION = "0.4.2";
const CARD_TYPE = "domusa-dashboard";
const UNIQUE_ID_PREFIX = "domusa_";

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
  { uid: "flow_temperature", label: "Heat pump supply", group: "Temperatures", unit: "°C" },
  { uid: "return_temperature", label: "Heat pump return", group: "Temperatures", unit: "°C" },
  { uid: "buffer_temperature", label: "Buffer temperature", group: "Temperatures", unit: "°C" },
  { uid: "dhw_temperature", label: "DHW temperature", group: "Temperatures", unit: "°C" },
  { uid: "evaporator_temperature", label: "Evaporator temperature", group: "Temperatures", unit: "°C" },
  { uid: "discharge_temperature", label: "Discharge temperature", group: "Temperatures", unit: "°C" },
  { uid: "suction_temperature", label: "Suction temperature", group: "Temperatures", unit: "°C" },
  { uid: "heat_exchanger_temperature", label: "Heat exchanger temperature", group: "Temperatures", unit: "°C" },
  { uid: "suction_evaporation_delta", label: "Suction / evaporation delta", group: "Temperatures", unit: "°C" },
  { uid: "evaporation_calculated", label: "Calculated evaporation", group: "Temperatures", unit: "°C" },
  { uid: "condensation_calculated", label: "Calculated condensation", group: "Temperatures", unit: "°C" },
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
  { uid: "water_flow", label: "Heat pump water flow", group: "Hydraulics", unit: "L/min" },
  { uid: "pump_c1_speed", label: "Internal pump C1 speed", group: "Hydraulics", unit: "%" },
  { uid: "fan1_rpm", label: "Fan 1 speed", group: "Hydraulics", unit: "rpm" },
  { uid: "fan2_rpm", label: "Fan 2 speed", group: "Hydraulics", unit: "rpm" },

  // Electrical
  { uid: "input_voltage", label: "Input voltage", group: "Electrical", unit: "V" },
  { uid: "ipm_voltage", label: "IPM voltage", group: "Electrical", unit: "V" },

  // Alarms and errors
  { uid: "alarm", label: "Alarm", group: "Alarms and errors", kind: "text" },
  { uid: "sub_alarm", label: "Sub alarm", group: "Alarms and errors", kind: "text" },
  { uid: "error_active", label: "Error active", group: "Alarms and errors", kind: "boolean" },
  { uid: "error_codes", label: "Error codes", group: "Alarms and errors", kind: "text" },
  { uid: "error_description", label: "Error description", group: "Alarms and errors", kind: "text" },

  // Configuration
  { uid: "config_acs_enabled", label: "DHW enabled", group: "Configuration", kind: "boolean" },
  { uid: "config_sgready_enabled", label: "SG Ready enabled", group: "Configuration", kind: "boolean" },
  { uid: "config_night_mode", label: "Night mode", group: "Configuration", kind: "boolean" },
  { uid: "config_buffer_mode", label: "Buffer mode", group: "Configuration", kind: "text" },
  { uid: "config_heat_cool_hysteresis", label: "Heating / cooling hysteresis", group: "Configuration" },
  { uid: "config_acs_hysteresis", label: "DHW hysteresis", group: "Configuration" },
  { uid: "config_buffer_hysteresis", label: "Buffer hysteresis", group: "Configuration" },

  // Counters and statistics
  { uid: "compressor_starts", label: "Compressor starts", group: "Statistics" },
  { uid: "compressor_runtime", label: "Compressor runtime", group: "Statistics" },
  { uid: "defrost_count", label: "Defrost count", group: "Statistics" },
  { uid: "energy_statistics", label: "Energy statistics", group: "Statistics", kind: "text" },

  // Daily energy and COP
  { uid: "daily_production", label: "Daily heat production", group: "Daily energy" },
  { uid: "daily_renewable", label: "Daily renewable energy", group: "Daily energy" },
  { uid: "daily_consumption", label: "Daily electricity consumption", group: "Daily energy" },
  { uid: "daily_cop", label: "Daily COP", group: "Daily energy" },
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
  "Alarms and errors",
  "Configuration",
  "Statistics",
  "Daily energy",
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
    return 12;
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
   * Registry mapping:
   * domusa_<cid>_<uid>
   *
   * Disabled entities are retained for diagnostics.
   * They are not treated as missing entities.
   */
  _mapBridgeEntities(entries) {
    const mapped = {};

    if (!Array.isArray(entries)) {
      return mapped;
    }

    for (const entry of entries) {
      if (!entry || !entry.unique_id || !entry.entity_id) {
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

      // Ignore auxiliary Bridge entities.
      // Only the actual heat pump device should be displayed.
      if (/_CONTROL$/i.test(deviceId) || /_SUB$/i.test(deviceId)) {
        continue;
      }

      if (!mapped[deviceId]) {
        mapped[deviceId] = {};
      }

      mapped[deviceId][definition.uid] = {
        entityId: entry.entity_id,
        disabledBy: entry.disabled_by || null,
      };
    }

    return mapped;
  }

  _getEntityEntry(deviceId, definition) {
    return this._entitiesByDevice[deviceId]?.[definition.uid] || null;
  }

  /*
   * Returns a structured status instead of silently converting
   * missing or unavailable entities into an OFF state.
   */
  _getEntityStatus(deviceId, definition) {
    const entry = this._getEntityEntry(deviceId, definition);

    if (!entry) {
      return {
        status: "not_registered",
        stateObj: null,
        entityId: null,
      };
    }

    if (entry.disabledBy) {
      return {
        status: "disabled",
        stateObj: null,
        entityId: entry.entityId,
        disabledBy: entry.disabledBy,
      };
    }

    const stateObj = this._hass?.states?.[entry.entityId];

    if (!stateObj) {
      return {
        status: "no_state",
        stateObj: null,
        entityId: entry.entityId,
      };
    }

    if (stateObj.state === "unknown") {
      return {
        status: "unknown",
        stateObj,
        entityId: entry.entityId,
      };
    }

    if (stateObj.state === "unavailable") {
      return {
        status: "unavailable",
        stateObj,
        entityId: entry.entityId,
      };
    }

    return {
      status: "available",
      stateObj,
      entityId: entry.entityId,
    };
  }

  _formatValue(statusInfo, definition) {
    if (!statusInfo || statusInfo.status !== "available") {
      const messages = {
        not_registered: "Not registered",
        disabled: "Disabled",
        no_state: "No state",
        unknown: "Unknown",
        unavailable: "Unavailable",
      };

      return messages[statusInfo?.status] || "Not available";
    }

    const stateObj = statusInfo.stateObj;
    const raw = stateObj.state;

    if (definition.kind === "mode") {
      return MODE_LABELS[String(raw)] || String(raw);
    }

    if (definition.kind === "boolean") {
      const normalized = String(raw).toLowerCase();

      if (["on", "true", "1"].includes(normalized)) {
        return "On";
      }

      if (["off", "false", "0"].includes(normalized)) {
        return "Off";
      }

      return String(raw);
    }

    if (definition.kind === "text") {
      return String(raw);
    }

    const numeric = Number(raw);

    if (!Number.isFinite(numeric)) {
      return String(raw);
    }

    // The Bridge already applies the pressure value conversion.
    // Do not apply another pressure scaling factor here.
    if (definition.kind === "target" && numeric === -255) {
      return "Not set";
    }

    const value = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 1,
    }).format(numeric);

    const unit =
      definition.unit ||
      stateObj.attributes?.unit_of_measurement ||
      "";

    return unit ? `${value} ${unit}` : value;
  }

  _getFormattedValue(deviceId, uid) {
    const definition = SENSOR_DEFINITIONS.find(
      (item) => item.uid === uid
    );

    if (!definition) {
      return "Not configured";
    }

    return this._formatValue(
      this._getEntityStatus(deviceId, definition),
      definition
    );
  }

  /*
   * Returns true, false, or null.
   * null means that the pump state cannot be determined.
   */
  _getBooleanState(deviceId, uid) {
    const definition = SENSOR_DEFINITIONS.find(
      (item) => item.uid === uid
    );

    if (!definition) {
      return null;
    }

    const info = this._getEntityStatus(deviceId, definition);

    if (info.status !== "available") {
      return null;
    }

    const value = String(info.stateObj.state).toLowerCase();

    if (["on", "true", "1"].includes(value)) {
      return true;
    }

    if (["off", "false", "0"].includes(value)) {
      return false;
    }

    return null;
  }

  _statusClass(statusInfo, definition) {
    if (!statusInfo || statusInfo.status !== "available") {
      return "muted";
    }

    if (definition.kind === "boolean") {
      const value = String(statusInfo.stateObj.state).toLowerCase();

      if (["on", "true", "1"].includes(value)) {
        return "active";
      }

      if (["off", "false", "0"].includes(value)) {
        return "inactive";
      }

      return "muted";
    }

    if (definition.kind === "mode") {
      const state = String(statusInfo.stateObj.state);

      return ["0", "Warten", "Standby"].includes(state)
        ? "muted"
        : "active";
    }

    return "";
  }

  _renderDiagramMetric(deviceId, uid, label) {
    const definition = SENSOR_DEFINITIONS.find(
      (item) => item.uid === uid
    );

    const info = definition
      ? this._getEntityStatus(deviceId, definition)
      : null;

    const value = definition
      ? this._formatValue(info, definition)
      : "Not configured";

    const statusClass = definition
      ? this._statusClass(info, definition)
      : "muted";

    return `
      <div class="diagram-metric">
        <div class="diagram-metric-label">
          ${this._escapeHtml(label)}
        </div>
        <div class="diagram-metric-value ${statusClass}">
          ${this._escapeHtml(value)}
        </div>
      </div>
    `;
  }

  _renderPumpStatus(deviceId) {
    const state = this._getBooleanState(
      deviceId,
      "heating_circuit_pump"
    );

    if (state === true) {
      return {
        text: "RUNNING",
        className: "pump-running",
      };
    }

    if (state === false) {
      return {
        text: "STOPPED",
        className: "pump-stopped",
      };
    }

    const definition = SENSOR_DEFINITIONS.find(
      (item) => item.uid === "heating_circuit_pump"
    );

    const info = this._getEntityStatus(deviceId, definition);

    return {
      text: this._formatValue(info, definition).toUpperCase(),
      className: "pump-unknown",
    };
  }

  _renderHydraulicView(deviceId) {
    const pumpState = this._getBooleanState(
      deviceId,
      "heating_circuit_pump"
    );

    const pumpStatus = this._renderPumpStatus(deviceId);

    // C4 status controls only the heating-circuit animation.
    // It does not prove that the heat pump's internal water circuit
    // or compressor is running.
    const c4FlowClass = pumpState === true ? "flow-active" : "";
    const pumpClass =
      pumpState === true
        ? "pump-active"
        : pumpState === false
          ? "pump-inactive"
          : "pump-unknown";

    return `
      <div class="diagram-panel hydraulic-panel">
        <div class="diagram-heading">
          <div>
            <div class="diagram-title">
              Hydraulic system
            </div>
            <div class="diagram-subtitle">
              Heat pump · buffer tank · heating circuit pump C4
            </div>
          </div>

          <div class="status-pill ${pumpStatus.className}">
            <span class="status-dot"></span>
            C4 ${this._escapeHtml(pumpStatus.text)}
          </div>
        </div>

        <div class="hydraulic-stage">
          <svg
            class="hydraulic-svg"
            viewBox="0 0 960 440"
            role="img"
            aria-label="Hydraulic circuit with heat pump, buffer tank, heating circuit pump C4 and return"
          >
            <defs>
              <linearGradient id="hp-shell" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#243d56"/>
                <stop offset="55%" stop-color="#152b40"/>
                <stop offset="100%" stop-color="#0a1727"/>
              </linearGradient>

              <linearGradient id="tank-shell" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#172e43"/>
                <stop offset="45%" stop-color="#31516a"/>
                <stop offset="100%" stop-color="#102337"/>
              </linearGradient>

              <linearGradient id="warm-pipe" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ff9a43"/>
                <stop offset="50%" stop-color="#ff6b3d"/>
                <stop offset="100%" stop-color="#ffb15b"/>
              </linearGradient>

              <linearGradient id="cold-pipe" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#39a9f5"/>
                <stop offset="50%" stop-color="#37d0e5"/>
                <stop offset="100%" stop-color="#398bd5"/>
              </linearGradient>

              <linearGradient id="tank-water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ff9a43" stop-opacity=".8"/>
                <stop offset="100%" stop-color="#258fc7" stop-opacity=".5"/>
              </linearGradient>

              <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="170%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="7"/>
                <feOffset dx="0" dy="7"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope=".38"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <filter id="pipe-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <marker id="warm-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                <path d="M0 0 L0 6 L8 3 Z" fill="#ff9a43"/>
              </marker>

              <marker id="cold-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                <path d="M0 0 L0 6 L8 3 Z" fill="#39a9f5"/>
              </marker>
            </defs>

            <!-- Background grid -->
            <g class="diagram-grid">
              ${Array.from({ length: 19 }, (_, i) =>
                `<line x1="${i * 54}" y1="0" x2="${i * 54}" y2="440"/>`
              ).join("")}
              ${Array.from({ length: 9 }, (_, i) =>
                `<line x1="0" y1="${i * 54}" x2="960" y2="${i * 54}"/>`
              ).join("")}
            </g>

            <!-- Supply line from heat pump to buffer -->
            <path
              class="pipe-base"
              d="M185 142 H300 H405"
            />
            <path
              class="pipe-supply"
              d="M185 142 H300 H405"
              marker-end="url(#warm-arrow)"
            />

            <!-- Buffer to C4 and heating circuit -->
            <path
              class="pipe-base"
              d="M555 142 H675 H810 V245"
            />
            <path
              class="pipe-supply ${c4FlowClass}"
              d="M555 142 H675 H810 V245"
              marker-end="url(#warm-arrow)"
            />

            <!-- Return line -->
            <path
              class="pipe-base"
              d="M810 325 V365 H300 H185 V190"
            />
            <path
              class="pipe-return ${c4FlowClass}"
              d="M810 325 V365 H300 H185 V190"
              marker-end="url(#cold-arrow)"
            />

            <!-- Heat pump enclosure -->
            <g filter="url(#soft-shadow)">
              <rect class="hp-shell" x="35" y="95" width="150" height="150" rx="20"/>
              <rect class="hp-front" x="48" y="108" width="124" height="124" rx="14"/>
              <circle class="hp-fan-ring" cx="110" cy="165" r="39"/>
              <circle class="hp-fan-hub" cx="110" cy="165" r="9"/>
              <path class="hp-fan-blade" d="M110 156 C85 127 80 149 102 163 Z"/>
              <path class="hp-fan-blade" d="M119 165 C148 140 153 163 123 172 Z"/>
              <path class="hp-fan-blade" d="M108 174 C88 207 111 207 115 176 Z"/>
              <text class="component-title" x="110" y="270" text-anchor="middle">DOMUSA</text>
              <text class="component-caption" x="110" y="288" text-anchor="middle">HEAT PUMP</text>
            </g>

            <!-- Flow sensor -->
            <g class="sensor-node">
              <circle cx="300" cy="142" r="15"/>
              <circle cx="300" cy="142" r="5"/>
              <text class="sensor-label" x="300" y="105" text-anchor="middle">SUPPLY</text>
              <text class="sensor-value" x="300" y="184" text-anchor="middle">
                ${this._escapeHtml(this._getFormattedValue(deviceId, "flow_temperature"))}
              </text>
            </g>

            <!-- Buffer tank -->
            <g filter="url(#soft-shadow)">
              <rect class="tank-shell" x="405" y="65" width="150" height="190" rx="26"/>
              <rect class="tank-inner" x="418" y="80" width="124" height="160" rx="18"/>
              <rect class="tank-water" x="419" y="145" width="122" height="94" rx="12"/>
              <path class="tank-highlight" d="M432 91 V225"/>
              <text class="tank-label" x="480" y="120" text-anchor="middle">BUFFER</text>
              <text class="tank-temp" x="480" y="185" text-anchor="middle">
                ${this._escapeHtml(this._getFormattedValue(deviceId, "buffer_temperature"))}
              </text>
              <text class="tank-caption" x="480" y="207" text-anchor="middle">TANK</text>
            </g>

            <!-- C4 pump -->
            <g filter="url(#soft-shadow)">
              <circle class="pump-housing ${pumpClass}" cx="675" cy="142" r="35"/>
              <circle class="pump-inner" cx="675" cy="142" r="25"/>
              <path class="pump-impeller" d="M666 128 L690 142 L666 156 Z"/>
              <text class="component-title" x="675" y="205" text-anchor="middle">PUMP C4</text>
              <text class="component-caption" x="675" y="222" text-anchor="middle">
                ${this._escapeHtml(pumpStatus.text)}
              </text>
            </g>

            <!-- Heating circuit -->
            <g filter="url(#soft-shadow)">
              <rect class="heating-shell" x="740" y="245" width="140" height="80" rx="16"/>
              <path class="radiator-line" d="M765 265 V305 M785 265 V305 M805 265 V305 M825 265 V305 M845 265 V305"/>
              <text class="component-title" x="810" y="348" text-anchor="middle">HEATING CIRCUIT</text>
            </g>

            <!-- Return sensor -->
            <g class="sensor-node">
              <circle cx="300" cy="365" r="15"/>
              <circle cx="300" cy="365" r="5"/>
              <text class="sensor-label" x="300" y="405" text-anchor="middle">RETURN</text>
              <text class="sensor-value" x="300" y="340" text-anchor="middle">
                ${this._escapeHtml(this._getFormattedValue(deviceId, "return_temperature"))}
              </text>
            </g>

            <text class="pipe-caption warm-caption" x="250" y="125">HEAT PUMP SUPPLY</text>
            <text class="pipe-caption warm-caption" x="610" y="125">TO HEATING CIRCUIT</text>
            <text class="pipe-caption cold-caption" x="560" y="390">RETURN TO HEAT PUMP</text>
          </svg>
        </div>

        <div class="diagram-legend">
          <span><i class="legend-dot warm"></i> Warm water / supply</span>
          <span><i class="legend-dot cold"></i> Return</span>
          <span><i class="legend-dot green"></i> Pump active</span>
        </div>

        <div class="diagram-metrics">
          ${this._renderDiagramMetric(deviceId, "flow_temperature", "Supply temperature · before buffer")}
          ${this._renderDiagramMetric(deviceId, "buffer_temperature", "Buffer temperature")}
          ${this._renderDiagramMetric(deviceId, "return_temperature", "Return temperature · before heat pump")}
          ${this._renderDiagramMetric(deviceId, "water_flow", "Heat pump water flow")}
          ${this._renderDiagramMetric(deviceId, "pump_c1_speed", "Internal pump C1 speed")}
          ${this._renderDiagramMetric(deviceId, "heating_circuit_pump", "Heating circuit pump C4")}
        </div>

        <div class="diagram-note">
          The water flow value is the heat pump measurement supplied by the Bridge.
          It is not a separate flow measurement downstream of pump C4.
          The C4 animation indicates only the heating circuit pump state.
        </div>
      </div>
    `;
  }

  _renderDevice(deviceId) {
    const groups = GROUP_ORDER.map((groupName) => {
      const definitions = SENSOR_DEFINITIONS.filter(
        (item) => item.group === groupName
      );

      const availableDefinitions = definitions.filter(
        (item) => this._getEntityEntry(deviceId, item)
      );

      if (!availableDefinitions.length) {
        return "";
      }

      const metrics = availableDefinitions.map((definition) => {
        const info = this._getEntityStatus(deviceId, definition);
        const value = this._formatValue(info, definition);
        const statusClass = this._statusClass(info, definition);

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
          <h3 class="group-title">${this._escapeHtml(groupName)}</h3>
          <div class="grid">${metrics}</div>
        </section>
      `;
    }).join("");

    const activeContent = this._activeView === "values"
      ? `<div class="content">${groups}</div>`
      : this._renderHydraulicView(deviceId);

    return `
      <section class="device">
        <h2 class="device-title">
          DOMUSA · ${this._escapeHtml(deviceId)}
        </h2>

        <div class="view-tabs">
          <button class="view-tab ${this._activeView === "hydraulic" ? "active" : ""}"
            data-view="hydraulic" type="button">
            Hydraulic circuit
          </button>

          <button class="view-tab ${this._activeView === "values" ? "active" : ""}"
            data-view="values" type="button">
            All measurements
          </button>
        </div>

        ${activeContent}
      </section>
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
        font-family: var(--primary-font-family, 'Segoe UI', Roboto, sans-serif);

        --domusa-text: var(--primary-text-color, #e8edf2);
        --domusa-secondary: var(--secondary-text-color, #9aa8b5);
        --domusa-card: var(--card-background-color, #18212b);
        --domusa-secondary-bg: var(--secondary-background-color, #202b36);
        --domusa-border: var(--divider-color, rgba(128, 128, 128, .22));
        --domusa-primary: var(--primary-color, #03a9f4);

        --domusa-surface: color-mix(
          in srgb,
          var(--domusa-card) 72%,
          transparent
        );

        --domusa-surface-soft: color-mix(
          in srgb,
          var(--domusa-card) 54%,
          transparent
        );

        --domusa-surface-strong: color-mix(
          in srgb,
          var(--domusa-card) 86%,
          transparent
        );

        --domusa-cyan: #42c8e5;
        --domusa-blue: #399ce0;
        --domusa-orange: #ff984c;
        --domusa-green: #38c987;
        --domusa-red: #f16f68;
        --domusa-muted: var(--secondary-text-color, #8da6ba);
      }

      ha-card {
        position: relative;
        overflow: hidden;
        color: var(--domusa-text);
        border: 1px solid var(--domusa-border);
        border-radius: 20px;

        background:
          radial-gradient(
            ellipse at 12% 0%,
            color-mix(in srgb, var(--domusa-primary) 13%, transparent),
            transparent 48%
          ),
          radial-gradient(
            ellipse at 90% 100%,
            rgba(66, 200, 229, .055),
            transparent 48%
          ),
          var(--domusa-card);

        box-shadow:
          var(--ha-card-box-shadow, 0 8px 28px rgba(0, 0, 0, .10)),
          inset 0 1px 0 rgba(255, 255, 255, .045);

        transition:
          box-shadow .3s ease,
          border-color .3s ease;
      }

      ha-card::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: .45;

        background-image: radial-gradient(
          circle,
          var(--domusa-muted) .65px,
          transparent .8px
        );

        background-size: 18px 18px;
        mask-image: linear-gradient(
          to bottom,
          rgba(0, 0, 0, .45),
          transparent 75%
        );
      }

      ha-card:hover {
        box-shadow:
          var(--ha-card-box-shadow, 0 12px 34px rgba(0, 0, 0, .14)),
          0 0 24px rgba(66, 200, 229, .045);
      }

      .header {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 22px 22px 17px;

        border-bottom: 1px solid var(--domusa-border);

        background:
          linear-gradient(
            110deg,
            color-mix(in srgb, var(--domusa-primary) 9%, transparent),
            transparent 68%
          );

        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }

      .heading { min-width: 0; }

      .title {
        color: var(--domusa-text);
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: .025em;
      }

      .subtitle {
        margin-top: 5px;
        color: var(--domusa-secondary);
        font-size: .8rem;
      }

      .version {
        padding: 6px 9px;
        border: 1px solid color-mix(in srgb, var(--domusa-primary) 28%, var(--domusa-border));
        border-radius: 8px;

        background: color-mix(
          in srgb,
          var(--domusa-primary) 9%,
          transparent
        );

        color: var(--domusa-primary);
        font-size: .7rem;
        white-space: nowrap;
      }

      .content {
        position: relative;
        padding: 0 20px 22px;
      }

      .device {
        position: relative;
      }

      .device + .device {
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid var(--domusa-border);
      }

      .device-title {
        margin: 18px 20px 12px;
        color: var(--domusa-secondary);
        font-size: .75rem;
        font-weight: 700;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .group + .group {
        margin-top: 20px;
      }

      .group-title {
        margin: 0 0 10px;
        color: var(--domusa-text);
        font-size: .88rem;
        font-weight: 650;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
        gap: 10px;
      }

      .metric {
        min-width: 0;
        padding: 13px;

        border: 1px solid var(--domusa-border);
        border-radius: 13px;

        background:
          linear-gradient(
            145deg,
            color-mix(in srgb, var(--domusa-card) 64%, transparent),
            color-mix(in srgb, var(--domusa-secondary-bg) 48%, transparent)
          );

        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, .045),
          0 5px 16px rgba(0, 0, 0, .055);

        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      .label {
        color: var(--domusa-secondary);
        font-size: .74rem;
        line-height: 1.4;
      }

      .value {
        margin-top: 8px;
        color: var(--domusa-text);
        font-size: 1.08rem;
        font-weight: 680;
        line-height: 1.3;
        overflow-wrap: anywhere;
      }

      .value.active { color: var(--domusa-green); }
      .value.inactive { color: var(--domusa-secondary); }
      .value.muted {
        color: var(--domusa-secondary);
        font-size: .9rem;
        font-weight: 550;
      }

      .message {
        position: relative;
        padding: 20px 22px;
        color: var(--domusa-secondary);
        font-size: .9rem;
        line-height: 1.55;
      }

      .error { color: var(--domusa-red); }

      .retry {
        margin-top: 12px;
        padding: 8px 13px;
        border: 1px solid var(--domusa-border);
        border-radius: 9px;
        background: var(--domusa-surface);
        color: var(--domusa-text);
        font: inherit;
        cursor: pointer;
      }

      .view-tabs {
        position: relative;
        display: flex;
        gap: 8px;
        padding: 0 20px 17px;
        overflow-x: auto;
      }

      .view-tab {
        padding: 9px 13px;
        border: 1px solid var(--domusa-border);
        border-radius: 10px;

        background: var(--domusa-surface-soft);
        color: var(--domusa-secondary);

        font: inherit;
        font-size: .78rem;
        cursor: pointer;
        white-space: nowrap;

        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);

        transition:
          background .2s ease,
          border-color .2s ease,
          color .2s ease,
          box-shadow .2s ease;
      }

      .view-tab:hover {
        border-color: color-mix(in srgb, var(--domusa-primary) 42%, var(--domusa-border));
        color: var(--domusa-text);
      }

      .view-tab.active {
        border-color: color-mix(in srgb, var(--domusa-primary) 60%, var(--domusa-border));

        background:
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--domusa-primary) 18%, transparent),
            color-mix(in srgb, var(--domusa-primary) 8%, var(--domusa-card))
          );

        color: var(--domusa-text);

        box-shadow:
          0 0 18px color-mix(in srgb, var(--domusa-primary) 10%, transparent),
          inset 0 1px 0 rgba(255, 255, 255, .07);
      }

      .diagram-panel {
        position: relative;
        margin: 0 18px 20px;
        padding: 16px;

        border: 1px solid var(--domusa-border);
        border-radius: 17px;

        background:
          radial-gradient(
            ellipse at 50% 0%,
            color-mix(in srgb, var(--domusa-primary) 10%, transparent),
            transparent 62%
          ),
          var(--domusa-surface);

        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, .055),
          0 10px 28px rgba(0, 0, 0, .075);

        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }

      .diagram-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      .diagram-title {
        color: var(--domusa-text);
        font-size: .98rem;
        font-weight: 700;
      }

      .diagram-subtitle {
        margin-top: 5px;
        color: var(--domusa-secondary);
        font-size: .74rem;
        line-height: 1.4;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 10px;

        border: 1px solid var(--domusa-border);
        border-radius: 20px;

        background: var(--domusa-surface-soft);
        color: var(--domusa-secondary);

        font-size: .65rem;
        font-weight: 700;
        white-space: nowrap;

        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
      }

      .pump-running { color: var(--domusa-green); }
      .pump-stopped { color: var(--domusa-secondary); }
      .pump-unknown { color: var(--domusa-orange); }

      .hydraulic-stage {
        overflow: hidden;

        border: 1px solid color-mix(
          in srgb,
          var(--domusa-border) 80%,
          transparent
        );

        border-radius: 14px;

        background:
          radial-gradient(
            ellipse at 50% 40%,
            rgba(48, 103, 139, .13),
            transparent 65%
          ),
          rgba(4, 15, 26, .22);
      }

      .hydraulic-svg {
        display: block;
        width: 100%;
        height: auto;
      }

      .diagram-grid line {
        stroke: rgba(122, 164, 191, .07);
        stroke-width: 1;
      }

      .hp-shell {
        fill: url(#hp-shell);
        stroke: rgba(111, 174, 207, .65);
        stroke-width: 2;
      }

      .hp-front {
        fill: rgba(19, 43, 62, .96);
        stroke: rgba(155, 202, 226, .3);
        stroke-width: 1.5;
      }

      .hp-fan-ring {
        fill: rgba(7, 20, 33, .6);
        stroke: #4d94b8;
        stroke-width: 3;
      }

      .hp-fan-hub { fill: #9fc8dc; }
      .hp-fan-blade {
        fill: #4d7e9a;
        stroke: #78a9c0;
        stroke-width: 1;
      }

      .component-title {
        fill: #e8f6ff;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: .05em;
      }

      .component-caption {
        fill: #8daabd;
        font-size: 9px;
        letter-spacing: .14em;
      }

      .pipe-base {
        fill: none;
        stroke: rgba(5, 12, 20, .9);
        stroke-width: 15;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .pipe-supply {
        fill: none;
        stroke: url(#warm-pipe);
        stroke-width: 7;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: url(#pipe-glow);
      }

      .pipe-return {
        fill: none;
        stroke: url(#cold-pipe);
        stroke-width: 7;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .pipe-supply.flow-active,
      .pipe-return.flow-active {
        stroke-dasharray: 13 12;
        animation: hydraulic-flow 1.2s linear infinite;
      }

      .sensor-node circle:first-child {
        fill: #122b40;
        stroke: #6fc7e4;
        stroke-width: 3;
      }

      .sensor-node circle:nth-child(2) { fill: #d9f5ff; }

      .sensor-label {
        fill: #a7c1d2;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .1em;
      }

      .sensor-value {
        fill: #e8f7ff;
        font-size: 12px;
        font-weight: 700;
      }

      .tank-shell {
        fill: url(#tank-shell);
        stroke: #6b9bb7;
        stroke-width: 2;
      }

      .tank-inner {
        fill: rgba(7, 19, 31, .55);
        stroke: rgba(166, 207, 228, .25);
      }

      .tank-water { fill: url(#tank-water); }

      .tank-highlight {
        stroke: rgba(255,255,255,.14);
        stroke-width: 4;
        stroke-linecap: round;
      }

      .tank-label {
        fill: #c8e2f0;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .16em;
      }

      .tank-temp {
        fill: #fff2df;
        font-size: 20px;
        font-weight: 700;
      }

      .tank-caption {
        fill: #c2d8e5;
        font-size: 9px;
        letter-spacing: .2em;
      }

      .pump-housing { stroke-width: 3; }

      .pump-active {
        fill: #155c50;
        stroke: #42d69a;
        filter: drop-shadow(0 0 8px rgba(56, 201, 135, .35));
      }

      .pump-inactive {
        fill: #263c4e;
        stroke: #8197a8;
      }

      .pump-unknown {
        fill: #55422d;
        stroke: #f0a64f;
      }

      .pump-inner {
        fill: rgba(4, 17, 27, .55);
        stroke: rgba(255,255,255,.2);
        stroke-width: 1.5;
      }

      .pump-impeller { fill: #d7edf6; }

      .heating-shell {
        fill: url(#tank-shell);
        stroke: #5d8ca9;
        stroke-width: 2;
      }

      .radiator-line {
        stroke: #9dc1d4;
        stroke-width: 5;
        stroke-linecap: round;
      }

      .pipe-caption {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .1em;
      }

      .warm-caption { fill: #ffad66; }
      .cold-caption { fill: #65c8ed; }

      .diagram-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin: 12px 2px 0;
        color: var(--domusa-secondary);
        font-size: .69rem;
      }

      .diagram-legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .legend-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .legend-dot.warm { background: var(--domusa-orange); }
      .legend-dot.cold { background: var(--domusa-blue); }
      .legend-dot.green { background: var(--domusa-green); }

      .diagram-metrics {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
        margin-top: 15px;
      }

      .diagram-metric {
        min-width: 0;
        padding: 11px 12px;

        border: 1px solid var(--domusa-border);
        border-radius: 11px;

        background:
          linear-gradient(
            145deg,
            color-mix(in srgb, var(--domusa-card) 62%, transparent),
            color-mix(in srgb, var(--domusa-secondary-bg) 42%, transparent)
          );

        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, .04),
          0 4px 12px rgba(0, 0, 0, .045);

        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      .diagram-metric-label {
        color: var(--domusa-secondary);
        font-size: .7rem;
        line-height: 1.35;
      }

      .diagram-metric-value {
        margin-top: 6px;
        color: var(--domusa-text);
        font-size: 1rem;
        font-weight: 680;
        overflow-wrap: anywhere;
      }

      .diagram-metric-value.active { color: var(--domusa-green); }
      .diagram-metric-value.inactive { color: var(--domusa-secondary); }

      .diagram-metric-value.muted {
        color: var(--domusa-secondary);
        font-size: .88rem;
      }

      .diagram-note {
        margin-top: 13px;
        padding-top: 11px;
        border-top: 1px solid var(--domusa-border);
        color: var(--domusa-secondary);
        font-size: .7rem;
        line-height: 1.5;
      }

      @keyframes hydraulic-flow {
        to { stroke-dashoffset: -50; }
      }

      @media (prefers-reduced-motion: reduce) {
        .pipe-supply.flow-active,
        .pipe-return.flow-active {
          animation: none;
        }

        ha-card {
          transition: none;
        }
      }

      @media (max-width: 520px) {
        .header {
          padding: 17px 15px 14px;
        }

        .content {
          padding: 0 12px 16px;
        }

        .device-title {
          margin-left: 12px;
          margin-right: 12px;
        }

        .view-tabs {
          padding-left: 12px;
          padding-right: 12px;
        }

        .diagram-panel {
          margin-left: 10px;
          margin-right: 10px;
          padding: 11px;
        }

        .diagram-heading {
          flex-direction: column;
        }

        .diagram-metrics {
          gap: 7px;
        }

        .diagram-metric {
          padding: 9px;
        }

        .diagram-metric-value {
          font-size: .91rem;
        }

        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
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
          <div class="error">Could not discover DOMUSA entities.</div>
          <div>${this._escapeHtml(this._error)}</div>
          <button class="retry" type="button">Retry discovery</button>
        </div>
      `;
    } else if (devices.length === 0) {
      body = `
        <div class="message">
          No DOMUSA Bridge entities were found in the Home Assistant
          entity registry. Check that the Bridge integration is loaded
          and that its unique IDs use the <code>domusa_</code> prefix.
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
            <div class="subtitle">Heat pump monitoring · Live Bridge data</div>
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
    description: "Read-only live monitoring for DOMUSA heat pumps using existing Bridge entities.",
    preview: false,
  });
}

console.info(
  `%c DOMUSA Dashboard %c ${CARD_VERSION} `,
  "color: white; background: #176b87; font-weight: bold;",
  "color: #176b87; background: transparent; font-weight: bold;"
);
