import React from 'react';
import { 
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  ToastAndroid
} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Header } from 'react-native-elements';
import firebase from 'firebase';  
import db from '../Config';

export default class TransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      buttonState: 'normal',
      scannedBookID: '',
      scannedStudentID: '',
      transactionMessage: '',
    };
  }

  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
      hasCameraPermissions: status === 'granted',
      buttonState: id,
      scanned: false,
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { buttonState } = this.state;
    if (buttonState === 'BookID') {
      this.setState({
        scanned: true,
        scannedBookID: data,
        buttonState: 'normal',
      });
    } else if (buttonState === 'StudentID') {
      this.setState({
        scanned: true,
        scannedStudentID: data,
        buttonState: 'normal',
      });
    }
  };

initiateBookIssue = async ()=>{
    //add a transaction
    db.collection("transaction").add({
      'studentId' : this.state.scannedStudentID,
      'bookId' : this.state.scannedBookID,
      'data' : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Issue"
    })

    //change book status
    db.collection("books").doc(this.state.scannedBookID).update({
      'bookAvailability' : false
    })
    //change number of issued books for student
    db.collection("students").doc(this.state.scannedStudentID).update({
      'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)
    })
     alert("Book Issued")
    this.setState({
      scannedStudentID : '',
      scannedBookID: ''
    })
  }

    initiateBookReturn = async ()=>{
    //add a transaction
    db.collection("transaction").add({
      'studentId' : this.state.scannedStudentID,
      'bookId' : this.state.scannedBookID,
      'date'   : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Return"
    })

    //change book status
    db.collection("books").doc(this.state.scannedBookID).update({
      'bookAvailability' : true
    })

    //change number of issued books for student
    db.collection("students").doc(this.state.scannedStudentID).update({
      'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(-1)
    })
    alert("Book Returned")
    this.setState({
      scannedStudentID : '',
      scannedBookID : ''
    })
  }
  
  handleTransaction = async()=>{
    var transactionMessage = null;
    var transactionType = await this.checkBookEligibility();

    if(!transactionType){
      alert("book doesn't exist in the library");
      this.setState({
        scannedStudentID : '',
        scannedBookID : ''
      })
    }else if(transactionType === 'Issue'){
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue();
      if(isStudentEligible){
        this.initiateBookIssue();
        alert('Book Issued')
      }
    }else{
      var isStudentEligible = await this.checkStudentEligibilityForBookReturn();
      if(isStudentEligible){ 
        this.initiateBookReturn();
        alert('Book Returned')
      }
    }
  }
  checkBookEligibility = async()=>{
    const bookRef = await db.collection("books").where("bookID","==",this.state.scannedBookID).get()
    var transactionType = ""
    if(bookRef.docs.length == 0){
      transactionType = false;
     // console.log(bookRef.docs.length)
    }
    else{
      bookRef.docs.map((doc)=>{
        var book = doc.data()
        if (book.bookAvailability){
          transactionType = "Issue"
        }
        else{
          transactionType = "Return"
        }
      })
    }

    return transactionType

  }

  checkStudentEligibilityForBookIssue = async()=>{
    const studentRef = await db.collection("students").where("studentID","==",this.state.scannedStudentID).get()
    var isStudentEligible = ""
    if(studentRef.docs.length == 0){
      this.setState({
        scannedStudentID: '',
        scannedBookID: ''
      })
      isStudentEligible = false
      alert("The student id doesn't exist in the database!")
    }
    else{
       studentRef.docs.map((doc)=>{
          var student = doc.data();
          if(student.numberOfBooksIssued < 2){
            isStudentEligible = true
          }
          else{
            isStudentEligible = false
          alert("The student has already issued 2 books!")
            this.setState({
              scannedStudentID: '',
              scannedBookID: ''
            })
          }

        })

    }

    return isStudentEligible

  }

  checkStudentEligibilityForReturn = async()=>{
    const transactionRef = await db.collection("transactions").where("bookID","==",this.state.scannedBookID).limit(1).get()
    var isStudentEligible = ""
    transactionRef.docs.map((doc)=>{
      var lastBookTransaction = doc.data();
      if(lastBookTransaction.studentID === this.state.scannedStudentID){
        isStudentEligible = true
      }
      else {
        isStudentEligible = false
       alert("The book wasn't issued by this student!")
        this.setState({
          scannedStudentID: '',
          scannedBookID: ''
        })
      }
    })
    return isStudentEligible
  }
  


  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== 'normal' && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    } else if (buttonState === 'normal') {
      return (
        <KeyboardAvoidingView behavior="padding" enabled>  
        <View style={{ backgroundColor: '#C6FFFB' }}>
        
          <Header
            backgroundColor="#1AFC9C"
            centerComponent={{
              text: 'WILY',
              style: { color: 'black', fontSize: 30 },
            }}
          />
          <Header
            backgroundColor="#1ACC9C"
            centerComponent={{
              text: 'Issue or Return Books',
              style: { color: 'black', fontSize: 18 },
            }}
          />
          <View style={styles.container}>
            <Image
              source={require('../assets/booklogo.jpg')}
              style={{ width: 150, height: 150, marginTop: 10 }}
            />

            <TextInput
              style={{
                fontSize: 20,
                justifyContent: 'center',
                margin: 10,
              }}
              placeholder="Book ID"
              onChangeText = {text=>this.setState({scannedBookID:text})}
              value={this.state.scannedBookID}
            />
 
            <Text style={styles.displayText}>
              {hasCameraPermissions === true
                ? this.state.scannedData
                : 'Request Camera Permission'}
            </Text>

            <TouchableOpacity
              onPress={() => {
                this.getCameraPermissions('BookID');
              }}
              style={styles.scanButton}>
              <Text style={styles.buttonText}>Scan QR Code</Text>
            </TouchableOpacity>
 
            <TextInput
              style={{
                fontSize: 20,
                justifyContent: 'center',
                margin: 10,
              }}
              placeholder="Student ID"
              onChangeText = {text=>this.setState({scannedStudentID:text})}
              value={this.state.scannedStudentID}
            />

            <TouchableOpacity
              onPress={() => {
                this.getCameraPermissions('StudentID');
              }}
              style={styles.scanButton}>
              <Text style={styles.buttonText}>Scan Student ID</Text>
            </TouchableOpacity>
            
           <Text style={styles.displayText}>{this.state.transactionMessage}</Text>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={async()=>{
            var transactionMessage = await this.handleTransaction();
            this.setState({scannedBookID:'', scannedStudentID:''})
          }}>
          <Text style={styles.submitButtonText}>Submit</Text> 
        </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>  
      );
    }
  } 
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  scanButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10,
  },
  buttonText: {
    fontSize: 20,
  },
   submitButton:{
    backgroundColor: '#FBC02D',
    width: 100,
    height:50
  },
  submitButtonText:{
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight:"bold",
    color: 'white'
  }
});
