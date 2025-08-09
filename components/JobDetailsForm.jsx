import DatePickerField from './DatePickerField';
import InputField from './InputField';
import SelectDropdown from './SelectDropdown';
import ShiftForm from './ShiftForm';
import { useEmployee } from '../context/EmployeeContext.jsx';
import React, { useState } from 'react';
import { Button, Text, TouchableOpacity, View } from 'react-native';

const paymentTypes = ['Monthly', 'Daily', 'Hourly'];
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function JobDetailsForm({ errors }) {
    const { form, updateForm } = useEmployee();
    const [showShiftForm, setShowShiftForm] = useState(false);
    const [newShifts, setNewShifts] = useState(form.shifts || []);

    const toggleWorkingDay = (day) => {
        const updatedDays = form.workingDays.includes(day)
            ? form.workingDays.filter((d) => d !== day)
            : [...form.workingDays, day];

        updateForm('workingDays', updatedDays);
    };

    const handleShiftChange = (updatedShifts) => {
        setNewShifts(updatedShifts);
        updateForm('shifts', updatedShifts);
    };

    return (
        <View>
            <Text style={styles.section}>Job Details</Text>

            <InputField
                label="Email"
                value={form.email}
                error={errors.email}
                onChangeText={(val) => updateForm('email', val)}
            />

            <SelectDropdown
                label="Payment Type"
                options={paymentTypes}
                selectedValue={form.paymentType}
                onValueChange={(val) => updateForm('paymentType', val)}
                error={errors.paymentType}
            />

            {(form.paymentType === 'Monthly' || form.paymentType === 'Daily' || form.paymentType === 'Hourly') && (
                <InputField
                    label={
                        form.paymentType === 'Hourly'
                            ? 'Hourly Wage'
                            : form.paymentType === 'Daily'
                                ? 'Daily Wage'
                                : 'Monthly Salary'
                    }
                    value={form.salary}
                    onChangeText={(val) => updateForm('salary', val)}
                    error={errors.salary}
                />
            )}

            {form.paymentType === 'Monthly' && (
                <InputField
                    label="Leaves in a Month"
                    value={form.leaves}
                    onChangeText={(val) => updateForm('leaves', val)}
                    error={errors.leaves}
                />
            )}

            {(form.paymentType === 'Monthly' || form.paymentType === 'Daily') && (
                <>
                    <InputField
                        label="Overtime Charges"
                        value={form.overtimeCharges}
                        onChangeText={(val) => updateForm('overtimeCharges', val)}
                        error={errors.overtimeCharges}
                    />

                    <DatePickerField
                        label="In-Time"
                        value={form.inTime}
                        onChange={(val) => updateForm('inTime', val)}
                        mode="time"
                    />
                    <DatePickerField
                        label="Out-Time"
                        value={form.outTime}
                        onChange={(val) => updateForm('outTime', val)}
                        mode="time"
                    />
                </>
            )}

            {form.paymentType === 'Monthly' && (
                <>
                    <Text style={styles.section}>Select Working Days</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {weekDays.map((day) => (
                            <TouchableOpacity
                                key={day}
                                onPress={() => toggleWorkingDay(day)}
                                style={{
                                    padding: 8,
                                    margin: 4,
                                    backgroundColor: form.workingDays.includes(day) ? '#007bff' : '#ccc',
                                    borderRadius: 6,
                                }}
                            >
                                <Text style={{ color: 'white' }}>{day}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

            {(form.paymentType === 'Monthly' || form.paymentType === 'Daily') && (
                <>
                    <Text style={styles.section}>Shifts</Text>
                    <Button
                        title={showShiftForm ? 'Hide Shift Form' : 'Add Shift'}
                        onPress={() => setShowShiftForm((prev) => !prev)}
                    />

                    {showShiftForm && <ShiftForm shifts={newShifts} setShifts={handleShiftChange} />}
                </>
            )}
        </View>
    );
}

const styles = {
    section: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
};
