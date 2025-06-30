import React from 'react';
import { Lightbulb } from 'lucide-react'; // Code больше не нужен, его можно убрать, но и оставить не критично

const examples = [
  { ip: '192.168.1.0', cidr: '24', description: 'Typical home network.' },
  { ip: '10.0.0.0', cidr: '8', description: 'Large corporate network (Class A private).' },
  { ip: '172.16.0.0', cidr: '12', description: 'Mid-sized corporate network (Class B private).' },
  { ip: '192.168.10.132', cidr: '27', description: 'A subnet with a smaller host range.' },
  { ip: '1.1.1.1', cidr: '32', description: 'A single host (loopback/point-to-point).' },
];

// onApplyExample теперь не используется, но мы оставим его в пропсах
// на случай, если вы когда-нибудь захотите восстановить функциональность
const Examples = ({ onApplyExample }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <Lightbulb size={24} className="mr-2 text-yellow-500" />
        Examples
      </h3>
      <div className="space-y-4">
        {examples.map((example, index) => (
          <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <div>
              <p className="font-mono text-gray-800 text-base">{example.ip}/{example.cidr}</p>
              <p className="text-sm text-gray-600">{example.description}</p>
            </div>
            {/* Кнопка "Apply" удалена */}
            {/* <button
              onClick={() => onApplyExample(example.ip, example.cidr)}
              className="btn-primary px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700"
            >
              Apply
            </button> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Examples;
