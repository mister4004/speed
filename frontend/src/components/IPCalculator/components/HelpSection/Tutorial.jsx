import React from 'react';
import { BookOpen } from 'lucide-react';

const tutorialSteps = [
  {
    title: '1. Enter IP Address and CIDR',
    description: 'Input the IP address and its corresponding CIDR value (e.g., 192.168.1.0/24) into the main calculator fields. You can toggle between CIDR and Subnet Mask input format.',
  },
  {
    title: '2. View Basic Subnet Details',
    description: 'The "Network Details" and "Hosts Information" sections will automatically update with the calculated network address, broadcast address, usable host range, and more.',
  },
  {
    title: '3. Explore Binary Representation',
    description: 'The "Visual Bit Representation" shows how the IP address is divided into network and host portions at the bit level.',
  },
  {
    title: '4. Use Advanced Tools (VLSM/Subnet Splitter)',
    description: 'Expand the "Advanced Tools" section to access powerful features like VLSM (Variable Length Subnet Masking) for efficient IP allocation and Subnet Splitter for dividing networks into smaller, equal parts.',
  },
  // { // <--- Этот блок был удален (закомментирован)
  //   title: '5. Get Help and Examples',
  //   description: 'Refer to the "Help & Examples" section for quick definitions of network terms and pre-filled examples to quickly test the calculator.',
  // },
];

const Tutorial = () => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <BookOpen size={24} className="mr-2 text-green-500" />
        How to Use
      </h3>
      <div className="space-y-4">
        {tutorialSteps.map((step, index) => (
          <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
            <p className="font-semibold text-gray-900 mb-1">{step.title}</p>
            <p className="text-sm text-gray-700">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tutorial;
