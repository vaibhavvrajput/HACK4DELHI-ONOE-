//import "../css/style.css"

const Web3 = require('web3');
const contract = require('@truffle/contract');

const votingArtifacts = require('../../build/contracts/Voting.json');
var VotingContract = contract(votingArtifacts)


window.App = {
  eventStart: function() { 
    window.ethereum.request({ method: 'eth_requestAccounts' });
    VotingContract.setProvider(window.ethereum)
    VotingContract.defaults({from: window.ethereum.selectedAddress,gas:6654755})

    // Load account data
    App.account = window.ethereum.selectedAddress;
    $("#accountAddress").html("Your Account: " + window.ethereum.selectedAddress);
    VotingContract.deployed().then(function(instance){
     instance.getCountCandidates().then(function(countCandidates){

            $(document).ready(function(){
              $('#addCandidate').click(function() {
                  var nameCandidate = $('#name').val();
                  var partyCandidate = $('#party').val();
                 instance.addCandidate(nameCandidate,partyCandidate).then(function(result){ })

            });   
              $('#addDate').click(function(){             
                  var startDate = Date.parse(document.getElementById("startDate").value)/1000;

                  var endDate =  Date.parse(document.getElementById("endDate").value)/1000;
           
                  instance.setDates(startDate,endDate).then(function(rslt){ 
                    console.log("tarihler verildi");
                  });

              });     

               instance.getDates().then(function(result){
                var startDate = new Date(result[0]*1000);
                var endDate = new Date(result[1]*1000);

                $("#dates").text( startDate.toDateString(("#DD#/#MM#/#YYYY#")) + " - " + endDate.toDateString("#DD#/#MM#/#YYYY#"));
              }).catch(function(err){ 
                console.error("ERROR! " + err.message)
              });           
          });
             
          for (var i = 0; i < countCandidates; i++ ){
            instance.getCandidate(i+1).then(function(data){
              var id = data[0];
              var name = data[1];
              var party = data[2];
              var voteCount = data[3];
              var viewCandidates = `<tr><td> <input class="form-check-input" type="radio" name="candidate" value="${id}" id=${id}>` + name + "</td><td>" + party + "</td><td>" + voteCount + "</td></tr>"
              $("#boxCandidate").append(viewCandidates)
            })
        }
        
        window.countCandidates = countCandidates 
      });

      instance.checkVote().then(function (voted) {
          console.log(voted);
          if(!voted)  {
            $("#voteButton").attr("disabled", false);

          }
      });

    }).catch(function(err){ 
      console.error("ERROR! " + err.message)
    })
  },

  vote: function() {    
    var candidateID = $("input[name='candidate']:checked").val();
    if (!candidateID) {
      $("#msg").html("<p>Please vote for a candidate.</p>")
      return
    }
    VotingContract.deployed().then(function(instance){
      instance.vote(parseInt(candidateID)).then(function(result){
        $("#voteButton").attr("disabled", true);
        $("#msg").html("<p>Voted</p>");
         window.location.reload(1);
      })
    }).catch(function(err){ 
      console.error("ERROR! " + err.message)
    })
  }
}

window.addEventListener("load", function() {
  if (typeof web3 !== "undefined") {
    console.warn("Using web3 detected from external source like Metamask")
    window.eth = new Web3(window.ethereum)
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for deployment. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
    window.eth = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"))
  }
  window.App.eventStart()
})

// --- SSI and Offline ballot helpers ---
(function(){
  const subtle = window.crypto && window.crypto.subtle;
  const SSI_KEY_NAME = 'local_ssi_key';

  async function generateKey() {
    if (!subtle) throw new Error('WebCrypto not available');
    const key = await subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify']);
    const jwk = await subtle.exportKey('jwk', key.privateKey || key);
    localStorage.setItem(SSI_KEY_NAME, JSON.stringify(jwk));
    return jwk;
  }

  async function importKeyFromJwk(jwk) {
    const key = await subtle.importKey('jwk', jwk, {name:'ECDSA', namedCurve: 'P-256'}, true, ['sign']);
    return key;
  }

  async function signBallotWithLocalKey(ballot) {
    const jwk = JSON.parse(localStorage.getItem(SSI_KEY_NAME) || 'null');
    if (!jwk) throw new Error('No local SSI key found');
    const key = await importKeyFromJwk(jwk);
    const enc = new TextEncoder();
    const signature = await subtle.sign({name: 'ECDSA', hash: {name: 'SHA-256'}}, key, enc.encode(JSON.stringify(ballot)));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  function downloadObject(obj, filename='ssi.json'){
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  function readFileAsText(file){
    return new Promise((resolve,reject)=>{
      const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.onerror = reject; fr.readAsText(file);
    })
  }

  // Offline storage for signed ballots
  const OFFLINE_BALLOTS_KEY = 'offline_signed_ballots';
  function storeOfflineBallot(signedBallot){
    const arr = JSON.parse(localStorage.getItem(OFFLINE_BALLOTS_KEY) || '[]');
    arr.push({signedBallot, timestamp: Date.now()});
    localStorage.setItem(OFFLINE_BALLOTS_KEY, JSON.stringify(arr));
  }

  async function sendStoredBallots(){
    const arr = JSON.parse(localStorage.getItem(OFFLINE_BALLOTS_KEY) || '[]');
    if (!arr.length) return {sent:0};

    // Get voter_id from localStorage (set at login) or prompt user
    let voterId = localStorage.getItem('voter_id');
    if (!voterId) {
      voterId = window.prompt('Enter your Voter ID to submit signed ballots:');
      if (!voterId) return {sent:0};
      localStorage.setItem('voter_id', voterId);
    }

    // Optionally send SSI public JWK if stored
    let ssiJwk = null;
    try { ssiJwk = JSON.parse(localStorage.getItem(SSI_KEY_NAME) || 'null'); } catch (_) {}

    const payload = {
      voter_id: voterId,
      ssi_public_jwk: ssiJwk && { kty: ssiJwk.kty, crv: ssiJwk.crv, x: ssiJwk.x, y: ssiJwk.y },
      ballots: arr.map(it => ({ ballot: it.signedBallot.ballot || it.ballot || it.signedBallot?.ballot, signature: it.signedBallot?.signature || it.signature }))
    };

    const res = await fetch('http://127.0.0.1:8000/submit-signed-ballots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Failed to submit ballots: ' + txt);
    }

    const data = await res.json();
    // Clear stored ballots after successful submission
    localStorage.setItem(OFFLINE_BALLOTS_KEY, JSON.stringify([]));
    return {sent: data.stored || arr.length};
  }

  // Wire UI
  window.addEventListener('DOMContentLoaded', ()=>{
    const gen = document.getElementById('generateSSI');
    const exportBtn = document.getElementById('exportSSI');
    const importBtn = document.getElementById('importSSI');
    const ssiFile = document.getElementById('ssiFile');
    const ssiInfo = document.getElementById('ssiInfo');
    const signBallot = document.getElementById('signBallot');
    const offlineInfo = document.getElementById('offlineInfo');
    const sendStored = document.getElementById('sendStoredBallots');

    if (gen) gen.addEventListener('click', async ()=>{
      try{ const jwk = await generateKey(); ssiInfo.textContent = 'Local SSI key generated.'; console.log(jwk); }
      catch(e){ ssiInfo.textContent = 'Key generation failed: '+e.message }
    });

    if (exportBtn) exportBtn.addEventListener('click', ()=>{
      const jwk = JSON.parse(localStorage.getItem(SSI_KEY_NAME) || 'null');
      if (!jwk){ ssiInfo.textContent = 'No SSI to export'; return }
      downloadObject(jwk, 'ssi-key.json');
    });

    if (importBtn) importBtn.addEventListener('click', ()=> ssiFile.click());
    if (ssiFile) ssiFile.addEventListener('change', async (e)=>{
      try{ const text = await readFileAsText(e.target.files[0]); const jwk = JSON.parse(text); localStorage.setItem(SSI_KEY_NAME, JSON.stringify(jwk)); ssiInfo.textContent = 'SSI imported'; }
      catch(err){ ssiInfo.textContent = 'Import failed: '+err.message }
    });

    if (signBallot) signBallot.addEventListener('click', async ()=>{
      try{
        const candidateID = document.querySelector("input[name='candidate']:checked")?.value;
        if (!candidateID) { offlineInfo.textContent = 'Select a candidate before signing.'; return }
        const ballot = {candidate: candidateID, timestamp: Date.now(), region: 'local'};
        const signature = await signBallotWithLocalKey(ballot);
        const signedBallot = {ballot, signature};
        storeOfflineBallot(signedBallot);
        offlineInfo.textContent = 'Ballot signed and stored offline.';
      }catch(e){ offlineInfo.textContent = 'Signing failed: '+e.message }
    });

    if (sendStored) sendStored.addEventListener('click', async ()=>{
      const res = await sendStoredBallots();
      offlineInfo.textContent = `Sent ${res.sent} stored ballots.`;
    });
  });

})();
