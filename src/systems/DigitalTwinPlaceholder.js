/**
 * DigitalTwinPlaceholder — future IoT integration hook.
 */
export class DigitalTwinPlaceholder {
    constructor() {
        this.panel = null;
    }

    show() {
        if (this.panel) return;
        this.panel = document.createElement('div');
        this.panel.className = 'digital-twin-panel glass';
        this.panel.innerHTML = `
      <div class="dt-header">
        <span>🌐 Digital Twin Mode</span>
        <button class="dt-close" id="dt-close">✕</button>
      </div>
      <div class="dt-body">
        <div class="dt-status">
          <div class="dt-indicator pending"></div>
          <span>Awaiting Hardware Connection</span>
        </div>
        <div class="dt-info">
          <p><strong>Future Integration:</strong></p>
          <ul>
            <li>Real sensor data streaming</li>
            <li>IoT device synchronization</li>
            <li>Hardware-software twin sync</li>
            <li>Remote lab access</li>
          </ul>
        </div>
        <div class="dt-mock">
          <div class="dt-mock-row"><span>Sensor Status</span><span class="dt-val">Standby</span></div>
          <div class="dt-mock-row"><span>Data Rate</span><span class="dt-val">— Hz</span></div>
          <div class="dt-mock-row"><span>Latency</span><span class="dt-val">— ms</span></div>
          <div class="dt-mock-row"><span>Connection</span><span class="dt-val badge-coming">Coming Soon</span></div>
        </div>
      </div>
    `;
        document.body.appendChild(this.panel);
        requestAnimationFrame(() => this.panel.classList.add('show'));
        document.getElementById('dt-close')?.addEventListener('click', () => this.hide());
    }

    hide() {
        if (this.panel) {
            this.panel.classList.remove('show');
            setTimeout(() => { this.panel?.remove(); this.panel = null; }, 300);
        }
    }

    toggle() {
        this.panel ? this.hide() : this.show();
    }
}
