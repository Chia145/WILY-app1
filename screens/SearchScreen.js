import React from 'react';
import { Text, View, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Header } from 'react-native-elements';
import db from '../Config';


export default class Searchscreen extends React.Component {
  constructor(props){
   super(props);
   this.state={
     allTransactions:[],
     lastVisibleTransaction:null,
     search: ''
   }
  }
    
  
  componentDidMount=async()=>{
    const query= await db.collection('transaction').get();
    query.docs.map((doc)=>{
       this.setState({
         allTransactions:[...this.state.allTransactions,doc.data()],
        lastVisibleTransaction:doc
    
    
        })
  })
}
  fetchMoreTransactions=async()=>{
    var text = this.state.search.toUpperCase()
    //split function consist of delimiter
      var enteredText = text.split("")
    
      
      if (enteredText[0].toUpperCase() ==='B'||enteredText[0].toUpperCase() ==='A'){
      const query = await db.collection("transactions").where('bookId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
      query.docs.map((doc)=>{
        this.setState({
          allTransactions: [...this.state.allTransactions, doc.data()],
          lastVisibleTransaction: doc
        })
      })
    }
      else if(enteredText[0].toUpperCase() === 'S' || enteredText[0].toUpperCase() === 'P'){
        const query = await db.collection("transactions").where('studentId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
        query.docs.map((doc)=>{
          this.setState({
            allTransactions: [...this.state.allTransactions, doc.data()],
            lastVisibleTransaction: doc
          })
        })
      }
  }





  
  searchTransactions=async(text)=>{
    var enteredText = text.split("")  
    if (enteredText[0].toUpperCase() ==='B'){
      const transaction =  await db.collection("transactions").where('bookId','==',text).get()
      transaction.docs.map((doc)=>{
        this.setState({
          allTransactions:[...this.state.allTransactions,doc.data()],
          lastVisibleTransaction: doc
        })
      })
    }
    else if(enteredText[0].toUpperCase() === 'S'){
      const transaction = await db.collection('transactions').where('studentId','==',text).get()
      transaction.docs.map((doc)=>{
        this.setState({
          allTransactions:[...this.state.allTransactions,doc.data()],
          lastVisibleTransaction: doc
        })
      })
    }

  }
  
  render() {
      return (
 <View>
       <View>
          <TextInput 
            placeholder = 'Search here'
            onChangeText={(text)=>{this.setState({search: text})}} 
            />        
          <TouchableOpacity
          onPress={()=>{this.searchTransactions(this.state.search)}}>
            <Text>SEARCH</Text>
          </TouchableOpacity>
          
        </View>
        <FlatList
          data={this.state.allTransactions}
          renderItems={({item})=>(
            <View style={{backgroundColor:'#C6FFFB',borderBottomWidth:2}}> 
            <Text>{"BOOKID:"+transaction.bookId}</Text>
            <Text>{"STUDENTID:"+transaction.studentId}</Text> 
            <Text>{"Date:"+transaction.data.toDate()}</Text> 
            <Text>{"Transaction Type:"+transaction.transactionType}</Text>
           </View>
          )}
          keyExtractor={(item,index)=>index.toString()}
          onEndReached={this.fetchMoreTransactions}
          onEndReachedThreshold={0.7}
          />
          </View>
      )
    }
  }