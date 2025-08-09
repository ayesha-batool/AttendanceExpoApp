import React from 'react';
import { Text } from 'react-native';
import { useEmployee } from '../context/EmployeeContext.jsx';
import DatePickerField from './DatePickerField';
import InputField from './InputField';
import PhoneNumberField from './PhoneNumberField';
import SelectDropdown from './SelectDropdown';

const employeeTypes = ['Permanent', 'Intern', 'Contract'];
const departments = ['HR', 'Finance', 'Engineering', 'Marketing'];
const designations = ['Manager', 'Developer', 'Analyst', 'Support'];

const EmployeeDetailsForm = ({ errors }) => {
  const { form, updateForm } = useEmployee();

  return (
    <>
      <Text style={styles.section}>Employee Details</Text>
      <InputField label="Full Name" value={form.fullName} onChangeText={val => updateForm('fullName', val)} error={errors.fullName} />
      <PhoneNumberField value={form.phone} onChange={val => updateForm('phone', val)} error={errors.phone} />
      <DatePickerField label="Joining Date" value={form.joiningDate} onChange={val => updateForm('joiningDate', val)} />
      <SelectDropdown label="Employee Type" options={employeeTypes} selectedValue={form.employeeType} onValueChange={val => updateForm('employeeType', val)} error={errors.employeeType} />
      <SelectDropdown label="Department" options={departments} selectedValue={form.department} onValueChange={val => updateForm('department', val)} error={errors.department} />
      <SelectDropdown label="Designation" options={designations} selectedValue={form.designation} onValueChange={val => updateForm('designation', val)} error={errors.designation} />
    </>
  );
};

const styles = {
  section: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
};

export default EmployeeDetailsForm;
