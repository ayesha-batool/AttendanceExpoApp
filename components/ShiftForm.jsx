import React from 'react';
import { Button, View } from 'react-native';
import DatePickerField from './DatePickerField';
import InputField from './InputField';

export default function ShiftForm({ shifts, setShifts }) {
    const updateShift = (index, field, value) => {
        const updated = [...shifts];
        updated[index][field] = value;
        setShifts(updated);
    };

    const addShift = () => {
        setShifts([...shifts, { name: '', in: '', out: '' }]);
    };

    const removeShift = (index) => {
        const updated = shifts.filter((_, i) => i !== index);
        setShifts(updated);
    };

    return (
        <View>
            {shifts.map((shift, index) => (
                <View key={index} style={{ marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#ddd' }}>
                    <InputField
                        label={`Shift ${index + 1} Name`}
                        value={shift.name}
                        onChangeText={(val) => updateShift(index, 'name', val)}
                    />
                    <DatePickerField
                        label="In-Time"
                        value={shift.in}
                        onChange={(val) => updateShift(index, 'in', val)}
                        mode="time"
                    />
                    <DatePickerField
                        label="Out-Time"
                        value={shift.out}
                        onChange={(val) => updateShift(index, 'out', val)}
                        mode="time"
                    />

                    <Button title="Remove" color="red" onPress={() => removeShift(index)} />
                </View>
            ))}

            <Button title="Add Shift" onPress={addShift} />
        </View>
    );
}
