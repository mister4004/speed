import React, { useState, useEffect } from 'react';

const NetworkUnitConverter = () => {
  const [standard, setStandard] = useState('si');
  const [inputValue, setInputValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('kbit');
  const [toUnit, setToUnit] = useState('bit');
  const [result, setResult] = useState('1000');
  const [isTyping, setIsTyping] = useState(false);

  // Поддерживаемые единицы измерения
  const units = [
    // Decimal (SI) units
    { id: 'bit', name: 'Bit (b)', multiplier: 1, system: 'si' },
    { id: 'kbit', name: 'Kilobit (kb) - network kilobit', multiplier: 1000, system: 'si' },
    { id: 'mbit', name: 'Megabit (Mb) - network megabit', multiplier: 1000000, system: 'si' },
    { id: 'gbit', name: 'Gigabit (Gb) - network gigabit', multiplier: 1000000000, system: 'si' },
    { id: 'tbit', name: 'Terabit (Tb) - network terabit', multiplier: 1000000000000, system: 'si' },
    
    // Binary (IEC) units
    { id: 'kibit', name: 'Kibibit (Kibit) - binary kilobit', multiplier: 1024, system: 'iec' },
    { id: 'mibit', name: 'Mebibit (Mibit) - binary megabit', multiplier: 1048576, system: 'iec' },
    { id: 'gibit', name: 'Gibibit (Gibit) - binary gigabit', multiplier: 1073741824, system: 'iec' },
    { id: 'tibit', name: 'Tebibit (Tibit) - binary terabit', multiplier: 1099511627776, system: 'iec' },
    
    // Bytes (common for both)
    { id: 'byte', name: 'Byte (B) - 8 bits', multiplier: 8, system: 'both' },
    { id: 'kbyte', name: 'Kilobyte (KB) - 1000 bytes', multiplier: 8000, system: 'both' },
    { id: 'mbyte', name: 'Megabyte (MB) - 1000 KB', multiplier: 8000000, system: 'both' },
    { id: 'gbyte', name: 'Gigabyte (GB) - 1000 MB', multiplier: 8000000000, system: 'both' },
    { id: 'tbyte', name: 'Terabyte (TB) - 1000 GB', multiplier: 8000000000000, system: 'both' },
  ];

  // Фильтрация единиц по выбранной системе
  const filteredUnits = units.filter(unit => 
    unit.system === 'both' || unit.system === standard
  );

  // Найти множитель по ID единицы
  const findMultiplier = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.multiplier : 1;
  };

  // Конвертация значений
  const convert = () => {
    if (!inputValue) return;
    
    try {
      const value = parseFloat(inputValue);
      if (isNaN(value)) return;
      
      const fromMultiplier = findMultiplier(fromUnit);
      const toMultiplier = findMultiplier(toUnit);
      
      // Конвертируем через биты
      const valueInBits = value * fromMultiplier;
      const resultValue = valueInBits / toMultiplier;
      
      // Форматируем результат
      if (resultValue >= 1000) {
        setResult(resultValue.toLocaleString(undefined, {
          maximumFractionDigits: 2
        }));
      } else if (resultValue < 0.0001) {
        setResult(resultValue.toExponential(4));
      } else {
        setResult(resultValue.toFixed(6).replace(/\.?0+$/, ''));
      }
    } catch (error) {
      setResult('Error');
      console.error('Conversion error:', error);
    }
  };

  // Автоматическая конвертация при изменении значений
  useEffect(() => {
    if (!isTyping) {
      convert();
    }
  }, [inputValue, fromUnit, toUnit, isTyping, standard]);

  // Обработчик изменения ввода
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsTyping(true);
    
    // Сбросить состояние ввода через 1 секунду
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // Поменять местами единицы измерения
  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-inner-light h-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Network Unit Converter
      </h2>
      
      {/* Переключатель систем измерения */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Measurement Standard:</span>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="standard"
                value="si"
                checked={standard === 'si'}
                onChange={() => setStandard('si')}
              />
              <span className="ml-2 text-sm">Decimal (SI)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="standard"
                value="iec"
                checked={standard === 'iec'}
                onChange={() => setStandard('iec')}
              />
              <span className="ml-2 text-sm">Binary (IEC)</span>
            </label>
          </div>
        </div>
        <div className="text-xs text-gray-600 mt-2">
          {standard === 'si' ? (
            <span>Decimal system: 1 kilobit (kb) = 1000 bits (used in networking, common for internet speed)</span>
          ) : (
            <span>Binary system: 1 kibibit (Kibit) = 1024 bits (used in computing, RAM, and storage)</span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Верхняя панель - ввод значения */}
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 mr-3">
            Value:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            placeholder="Enter value"
          />
        </div>
        
        {/* Контейнер для конвертации */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Левая колонка - исходная единица */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From:
            </label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {filteredUnits.map(unit => (
                <option key={`from-${unit.id}`} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Центр - кнопка обмена */}
          <div className="flex justify-center">
            <button
              onClick={swapUnits}
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Swap units"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>
          
          {/* Правая колонка - целевая единица */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To:
            </label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {filteredUnits.map(unit => (
                <option key={`to-${unit.id}`} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Результат конвертации */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-sm text-blue-700 mb-1">Converted Value:</div>
          <div className="text-2xl font-bold text-blue-900 text-center">
            {result}
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            {filteredUnits.find(u => u.id === toUnit)?.name || ''}
          </div>
        </div>
        
        {/* Быстрые конвертации */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Common Conversions:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button 
              onClick={() => { 
                setStandard('si');
                setFromUnit('mbit'); 
                setToUnit('mbyte'); 
              }}
              className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Mbps → MB/s
            </button>
            <button 
              onClick={() => { 
                setStandard('si');
                setFromUnit('gbit'); 
                setToUnit('mbyte'); 
              }}
              className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Gbps → MB/s
            </button>
            <button 
              onClick={() => { 
                setStandard('iec');
                setFromUnit('mibit'); 
                setToUnit('mibyte'); 
              }}
              className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Mibit → MiB
            </button>
            <button 
              onClick={() => { 
                setStandard('iec');
                setFromUnit('gibit'); 
                setToUnit('gibyte'); 
              }}
              className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Gibit → GiB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkUnitConverter;
