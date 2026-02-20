export class DataDisplay {
    constructor(dataContainerId, formulaContainerId) {
        this.dataContainer = document.getElementById(dataContainerId);
        this.formulaContainer = document.getElementById(formulaContainerId);
    }

    /**
     * Set data rows: [{ label, value, unit }]
     */
    setData(rows) {
        this.dataContainer.innerHTML = '';

        rows.forEach(row => {
            const div = document.createElement('div');
            div.className = 'data-row';
            div.innerHTML = `
        <span class="data-label">${row.label}</span>
        <span class="data-value" id="data-${row.id || row.label.toLowerCase().replace(/\s+/g, '-')}">${row.value} ${row.unit || ''}</span>
      `;
            this.dataContainer.appendChild(div);
        });
    }

    /**
     * Update a single data row value
     */
    updateValue(id, value, unit = '') {
        const el = document.getElementById(`data-${id}`);
        if (el) {
            el.textContent = `${value} ${unit}`;
        }
    }

    /**
     * Set formulas: string[]
     */
    setFormulas(formulas) {
        this.formulaContainer.innerHTML = '';

        formulas.forEach(formula => {
            const div = document.createElement('div');
            div.className = 'formula-item';
            div.textContent = formula;
            this.formulaContainer.appendChild(div);
        });
    }

    clear() {
        this.dataContainer.innerHTML = '';
        this.formulaContainer.innerHTML = '';
    }
}
