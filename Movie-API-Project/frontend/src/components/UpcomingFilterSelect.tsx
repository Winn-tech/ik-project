// import React from "react";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// interface FilterSelectProps {
//   value: string;
//   onValueChange: (value: string) => void;
//   options: { value: string; label: string }[];
//   placeholder: string;
//   className?: string;
// }

// const UpcomingFilterSelect: React.FC<FilterSelectProps> = ({
//   value,
//   onValueChange,
//   options,
//   placeholder,
//   className,
// }) => {
//   // Check if any option has an empty value and add a fallback
//   const safeOptions = options.map(option => ({
//     ...option,
//     value: option.value || "default"  // Ensure no empty string values
//   }));

//   return (
//     <Select value={value} onValueChange={onValueChange}>
//       <SelectTrigger className={className}>
//         <SelectValue placeholder={placeholder} />
//       </SelectTrigger>
//       <SelectContent className="bg-flicks-dark border border-flicks-teal/20 text-flicks-light">
//         <SelectGroup>
//           {safeOptions.map((option) => (
//             <SelectItem
//               key={option.value}
//               value={option.value}
//               className="cursor-pointer hover:bg-flicks-teal/10"
//             >
//               {option.label}
//             </SelectItem>
//           ))}
//         </SelectGroup>
//       </SelectContent>
//     </Select>
//   );
// };

// export default UpcomingFilterSelect;

import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}

const UpcomingFilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder,
  className,
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-flicks-dark border border-flicks-teal/20 text-flicks-light">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="cursor-pointer hover:bg-flicks-teal/10"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default UpcomingFilterSelect;