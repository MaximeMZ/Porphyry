import React from 'react';
import { Link } from 'react-router-dom';
import Hypertopic from 'hypertopic';
import conf from '../../config/config.json';
import Header from '../Header/Header.jsx';
import Authenticated from '../Authenticated/Authenticated.jsx';

import '../../styles/App.css';

const db = new Hypertopic(conf.services);

const _log = (x) => console.log(JSON.stringify(x, null, 2));
const _error = (x) => console.error(x.message);

function makeID() {
  var id = '';
  for (var i = 0; i < 6; i++) {
    id += Math.random().toString(15).substring(10);
  }
  id = id.slice(0, 32);
  return id;
}

class Outliner extends React.Component {

  constructor() {
    super();
    this.state = { };
    this.user = conf.user || window.location.hostname.split('.', 1)[0];
  }

  render() {
    let status = this._getStatus();
    return (
      <div className="App container-fluid">
        <Header />
        <div className="Status row h5">
          <Authenticated/>
          <Link to="/" className="badge badge-pill badge-light TopicTag">
            <span className="badge badge-pill badge-dark oi oi-chevron-left"> </span> Retour à l'accueil
          </Link>
        </div>
        <div className="container-fluid">
          <div className="App-content row">
            <div className="col-md-12 p-4">
              <div className="Description">
                <h2 className="h4 font-weight-bold text-center">{status}</h2>
                <div className="p-3">
                  {this.state.title ? '' : this._getTitle()}
                  <ul className="Outliner">
                    <Node topics={this.state.topics} name={this.state.title}/>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  _getTitle() {
    return (<form className="input-group" onSubmit={(e) => this._newVP(e)}>
      <input type="text" name="newTitle" className="form-control" placeholder="Nom du point de vue" />
      <div className="input-group-append">
        <button type="submit" className="btn add btn-sm btn-light"><span className="oi oi-plus"> </span></button>
      </div>
    </form>);
  }

  _getStatus() {
    if (this.state.title !== undefined) {
      return "Modification du point de vue";
    } else {
      return "Création du point de vue";
    }
  }

  _newVP(e) {
    e.preventDefault();
    let title = e.target.newTitle.value;
    if (!title) {
      return;
    }
    db.post({ _id: this.props.match.params.id, viewpoint_name: title, topics: {}, users: [this.user] })
      .then(_log)
      .then(_ => this.setState({ title }))
      .then(_ => this._fetchData())
      .catch(_error);
  }

  componentDidMount() {
    this._fetchData();
    this._timer = setInterval(this._fetchData.bind(this),1000);
  }

  componentWillUnmount() {
    clearInterval(this._timer);
  }

  applyChange() {
    db.get({ _id: this.props.match.params.id })
      .then(data => {
        data.topics = this.props.topics;
        data.viewpoint_name = this.state.title;
        return data;
      })
      .then(db.post)
      .catch(_ => {
        _error(_);
        this._fetchData()
      });
  }

  _fetchData() {
    return db.get({ _id: this.props.match.params.id })
      .then(x => {
        this.setState({ topics: x.topics, title: x.viewpoint_name });
      });
  }


}

class Node extends React.Component {

  constructor() {
    super();
    this.state = { edit:false, active:false, open: false };
    this.user = conf.user || window.location.hostname.split('.', 1)[0];
  }

  render = () => {
    let switchOpen = () => {
      this.setState({open:!this.state.open});
    }
    let handleInput = (e) => {
    };
    let thisNode;
    if (this.state.edit) {
      thisNode=<input type='text' defaultValue={this.props.name} onKeyPress={handleInput} />;
    } else {
      thisNode=<span className="node">{this.props.name}</span>;
    }
    let children=[];
    if (this.props.topics) {
      for (var topID in this.props.topics) {
        let topic=this.props.topics[topID];
        if (this.props.id && topic.broader.indexOf(this.props.id)!=-1
          || !this.props.id && topic.broader.length==0) {
            children.push(
              <Node key={topID} id={topID} name={topic.name} topics={this.props.topics} parent={this.props.id} />
            );
        }
      }
    }
    var classes=["outliner-node"];
    let caret;
    if (this.props.id && children.length) {
      caret=<span className="caret" onClick={switchOpen}> </span>;
      if (this.state.open) classes.push("open");
      else classes.push("closed");
    } else {
      caret=null;
    }
    return (
      <li className={classes.join(" ")}>
        {caret}<span className="wrap">{thisNode}</span>
        <ul>{children}</ul>
      </li>);
  };

}

export default Outliner;
