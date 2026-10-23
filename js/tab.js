(() => {
    class ValidationError extends Error {}

    const baseAmounts = {
        '4.7': 100000,
        '28': 50000
    };
    const exchangeRate = 0.024435;
    const numberFormat = new Intl.NumberFormat('zh-TW', {
        maximumFractionDigits: 10
    });
    const integerFormat = new Intl.NumberFormat('zh-TW', {
        maximumFractionDigits: 0
    });
    const preciseFormat = new Intl.NumberFormat('zh-TW', {
        maximumFractionDigits: 10
    });
    const formatTwd = (amount) => `NT$ ${integerFormat.format(amount)}`;
    const formatPreciseTwd = (amount) => `NT$ ${preciseFormat.format(amount)}`;

    function getRoleElement(calculator, role) {
        const element = calculator.querySelector(`[data-frequency-role="${role}"]`);
        if (!element) {
            throw new Error(`頻率使用費計算器缺少 ${role} 欄位。`);
        }
        return element;
    }

    function createCalculatorCopies() {
        const sourceCalculator = document.querySelector('#frequencyTypePane1 .frequency-calc');
        if (!sourceCalculator) {
            throw new Error('找不到行動通信頻率使用費計算表格。');
        }

        document.querySelectorAll('#frequencyTypeTabContent [data-frequency-calc-mount]').forEach((mount) => {
            const pane = mount.closest('.tab-pane');
            const suffix = pane.id.replace('frequencyTypePane', '');
            const calculator = sourceCalculator.cloneNode(true);
            const idMap = new Map();

            calculator.querySelectorAll('[id]').forEach((element) => {
                const updatedId = `${element.id}-${suffix}`;
                idMap.set(element.id, updatedId);
                element.id = updatedId;
            });

            calculator.querySelectorAll('*').forEach((element) => {
                ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls'].forEach((attribute) => {
                    const value = element.getAttribute(attribute);
                    if (value) {
                        element.setAttribute(
                            attribute,
                            value
                                .split(/\s+/)
                                .map((id) => idMap.get(id) || id)
                                .join(' ')
                        );
                    }
                });

                const name = element.getAttribute('name');
                if (name) {
                    element.setAttribute('name', `${name}-${suffix}`);
                }
            });

            mount.replaceWith(calculator);
        });
    }

    function initializeCalculator(calculator) {
        const urbanAreaInput = getRoleElement(calculator, 'urban-area');
        const otherAreaInput = getRoleElement(calculator, 'other-area');
        const yearsInput = getRoleElement(calculator, 'years');
        const baseAmountOutput = getRoleElement(calculator, 'base-amount');
        const resultOutput = getRoleElement(calculator, 'result');
        const formulaOutput = getRoleElement(calculator, 'formula');
        const errorOutput = getRoleElement(calculator, 'error');
        const calculateButton = getRoleElement(calculator, 'calculate');

        function getSelectedBand() {
            const selectedBand = calculator.querySelector('input[type="radio"]:checked');
            if (!selectedBand || !Object.prototype.hasOwnProperty.call(baseAmounts, selectedBand.value)) {
                throw new ValidationError('請選擇有效的頻率。');
            }
            return selectedBand.value;
        }

        function updateBaseAmount() {
            baseAmountOutput.textContent = formatPreciseTwd(baseAmounts[getSelectedBand()] * exchangeRate);
        }

        function clearResult() {
            errorOutput.hidden = true;
            errorOutput.textContent = '';
            resultOutput.textContent = '計算結果：尚未計算';
            formulaOutput.textContent = '';
        }

        function readNonNegativeInput(input, label) {
            const rawValue = input.value.trim();
            if (rawValue === '') {
                throw new ValidationError(`請輸入${label}。`);
            }

            const value = Number(rawValue);
            if (!Number.isFinite(value) || value < 0) {
                throw new ValidationError(`${label}必須是大於或等於 0 的有效數值。`);
            }
            return value;
        }

        calculator.querySelectorAll('input[type="radio"]').forEach((radio) => {
            radio.addEventListener('change', () => {
                updateBaseAmount();
                clearResult();
            });
        });

        [urbanAreaInput, otherAreaInput, yearsInput].forEach((input) => {
            input.addEventListener('input', clearResult);
            input.addEventListener('change', clearResult);
        });

        calculateButton.addEventListener('click', () => {
            clearResult();

            try {
                const urbanArea = readNonNegativeInput(urbanAreaInput, '都會區域面積');
                const otherArea = readNonNegativeInput(otherAreaInput, '都會區以外區域面積');
                const years = Number(yearsInput.value);
                if (![2, 3, 4, 5].includes(years)) {
                    throw new ValidationError('請選擇有效的頻率使用期間。');
                }

                const band = getSelectedBand();
                const baseAmount = baseAmounts[band];
                const areaFactor = 5 * urbanArea + otherArea + 1;
                const resultKrw = baseAmount * areaFactor * years * 10;
                const resultTwd = resultKrw * exchangeRate;
                const baseAmountTwd = baseAmount * exchangeRate;
                if (!Number.isFinite(resultTwd) || !Number.isFinite(baseAmountTwd)) {
                    throw new ValidationError('計算結果超出可處理範圍，請確認輸入值。');
                }

                const roundedTwd = Math.round(resultTwd);
                resultOutput.textContent = `計算結果：${formatTwd(roundedTwd)}`;
                formulaOutput.textContent =
                    `計算式：${formatPreciseTwd(baseAmountTwd)} × ` +
                    `(5 × ${numberFormat.format(urbanArea)} + ${numberFormat.format(otherArea)} + 1) × ` +
                    `${years} 年 × 10 區塊 ` +
                    `≈ ${formatTwd(roundedTwd)}（四捨五入至元）`;
            } catch (error) {
                if (!(error instanceof ValidationError)) {
                    throw error;
                }
                errorOutput.textContent = error.message;
                errorOutput.hidden = false;
                resultOutput.textContent = '計算結果：尚未計算';
            }
        });

        updateBaseAmount();
    }

    createCalculatorCopies();
    document.querySelectorAll('#frequencyTypeTabContent .frequency-calc').forEach((calculator) => {
        initializeCalculator(calculator);
    });
})();
