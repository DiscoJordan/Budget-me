import React , { useState }from "react";

import { StyleSheet, Text, View, Switch, SafeAreaView , Button} from "react-native";
function Goal({ goal, goals ,setGoals, key1}) {
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    let deleteGoal =()=>{
        setGoals(goals.filter(currentGoal=>currentGoal.key!==key1))
    }
  return (
    <View style={styles.goal}>
         <Switch
        trackColor={{false: '#767577', true: '#81b0ff'}}
        thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
      />
      <Text style={isEnabled?styles.done:''}>{goal}</Text>
      <Button onPress={deleteGoal} title="Delete"></Button>
    </View>
  );

  
}
const styles = StyleSheet.create({
    goal: {
    borderRadius:'20px',
    backgroundColor: "orange",
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    padding: 20,
    width:'100%',
    gap: 20,
    
  },
  done: {
   color: 'gray',
   textDecorationLine:'line-through'
  },})
export default Goal;
