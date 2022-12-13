import React, {useEffect, useState} from 'react';
import axios from "axios";
import useAuthContext from "../hooks/useAuthContext";
import {useNavigate} from "react-router-dom";

// import {modelConfigurations} from "../modelConfigurations";

import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Stack from "@mui/material/Stack";
import IconButton from '@mui/material/IconButton';
import MuiAlert from '@mui/material/Alert';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Checkbox from '@mui/material/Checkbox';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';

import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {DesktopDatePicker} from '@mui/x-date-pickers/DesktopDatePicker';

import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TerminalIcon from '@mui/icons-material/Terminal';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ChevronRight from '@mui/icons-material/ChevronRight';
import DataThresholdingIcon from '@mui/icons-material/DataThresholding';
import DateRangeIcon from '@mui/icons-material/DateRange';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import LineAxisOutlinedIcon from '@mui/icons-material/LineAxisOutlined';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';

import Breadcrumb from "../components/layout/Breadcrumb";
import FullPageLoading from "../components/layout/FullPageLoading";
import DatasetConfiguration from "../components/loadForecastingPipeline/DatasetConfiguration";
import ModelTrainingSetup from "../components/loadForecastingPipeline/ModelTrainingSetup";
import ModelEvaluationSetup from "../components/loadForecastingPipeline/ModelEvaluationSetup";
import ExperimentExecution from "../components/loadForecastingPipeline/ExperimentExecution";

const AlertCustom = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const breadcrumbs = [
    <Link fontSize={'20px'} underline="hover" key="1" color="inherit" href="/">
        Dashboard
    </Link>, <Typography
        underline="hover"
        key="2"
        color="secondary"
        fontSize={'20px'}
        fontWeight={600}>
        Load Forecasting
    </Typography>,];

const LoadForecast = () => {
    const {roles} = useAuthContext()
    const navigate = useNavigate();
    const [allowed, setAllowed] = useState(null)
    const [newFile, setNewFile] = useState()
    const [dayFirst, setDayFirst] = useState(false)
    const [models, setModels] = useState([])
    const [model, setModel] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const [loading, setLoading] = useState(false)
    const [executionLoading, setExecutionLoading] = useState(false)
    const [executionInitiated, setExecutionInitiated] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [newFileSuccess, setNewFileSuccess] = useState(false)
    const [newFileFailure, setNewFileFailure] = useState(false)
    const [executionSuccess, setExecutionSuccess] = useState(false)
    const [executionFailure, setExecutionFailure] = useState(false)

    const [availableConfigurations, setAvailableConfigurations] = useState([])
    const [chosenConfiguration, setChosenConfiguration] = useState('')

    const [resolutions, setResolutions] = useState([])

    const [maxDate, setMaxDate] = useState(null)
    const [minDate, setMinDate] = useState(null)
    const [minDateTestStart, setMinDateTestStart] = useState(null)
    const [maxDateTestStart, setMaxDateTestStart] = useState(null)
    const [minDateEndStart, setMinDateEndStart] = useState(null)

    // Parameter variables
    const [experimentName, setExperimentName] = useState('')
    const [experimentNameError, setExperimentNameError] = useState(false)
    const [experimentResolution, setExperimentResolution] = useState('')

    const [dateVal, setDateVal] = useState(null)
    const [dateTest, setDateTest] = useState(null)
    const [dateEnd, setDateEnd] = useState(null)
    const [forecastHorizon, setForecastHorizon] = useState(24)
    const [ignorePrevious, setIgnorePrevious] = useState(true)
    const [seriesUri, setSeriesUri] = useState('')

    useEffect(() => {
        if (roles) {
            (roles.includes('data_scientist') || roles.includes('inergy_admin')) ? setAllowed(true) : navigate('/')
        }
    }, [roles])

    useEffect(() => {
        axios.get('/models/get_model_names')
            .then(response => setModels(response.data))
            .catch(error => console.log(error))
    }, [])

    useEffect(() => {
        setForecastHorizon(Math.floor(288 / (experimentResolution / 5)))
    }, [experimentResolution])

    useEffect(() => {
        axios.get('/experimentation_pipeline/training/hyperparameter_entrypoints')
            .then(response => {
                let myArray = Object.entries(response.data)
                const myArrayFiltered = myArray.filter(element => (element[0].includes(model.search_term)))
                setAvailableConfigurations(myArrayFiltered)
                setChosenConfiguration('')
            })
            .catch(error => console.log(error))

    }, [model])

    useEffect(() => {
        dateVal && setMinDateTestStart(new Date(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate() + 10))
    }, [dateVal])

    useEffect(() => {
        dateTest && setMinDateEndStart(new Date(dateTest.getFullYear(), dateTest.getMonth(), dateTest.getDate() + 10))
    }, [dateTest])

    useEffect(() => {
        dateTest && (dateTest < minDateTestStart) && setDateTest(null)
    }, [minDateTestStart])

    useEffect(() => {
        dateEnd && (dateEnd < minDateEndStart) && setDateEnd(null)
    }, [minDateEndStart])

    const closeSnackbar = () => {
        setNewFileSuccess(false)
        setNewFileFailure(false)

        setExecutionSuccess(false)
        setExecutionFailure(false)
    }

    return (<div>
        <Breadcrumb breadcrumbs={breadcrumbs} welcome_msg={''}/>

        {allowed && <React.Fragment>
            {/* Dataset Configuration */}
            <DatasetConfiguration
                executionLoading={executionLoading}
                setNewFile={setNewFile}
                newFile={newFile}
                uploadSuccess={uploadSuccess}
                dayFirst={dayFirst}
                setDayFirst={setDayFirst}
                experimentResolution={experimentResolution}
                setExperimentResolution={setExperimentResolution}
                resolutions={resolutions}
                dateVal={dateVal}
                minDate={minDate}
                maxDate={maxDate}
                dateTest={dateTest}
                minDateTestStart={minDateTestStart}
                maxDateTestStart={maxDateTestStart}
                dateEnd={dateEnd}
                minDateEndStart={minDateEndStart}
                setDateVal={setDateVal}
                setDateTest={setDateTest}
                setDateEnd={setDateEnd}
                setLoading={setLoading}
                setUploadSuccess={setUploadSuccess}
                setExecutionSuccess={setExecutionSuccess}
                setExecutionFailure={setExecutionFailure}
                setMinDate={setMinDate}
                setMaxDate={setMaxDate}
                setMaxDateTestStart={setMaxDateTestStart}
                setSeriesUri={setSeriesUri}
                setNewFileSuccess={setNewFileSuccess}
                setNewFileFailure={setNewFileFailure}
                setResolutions={setResolutions}
                setErrorMessage={setErrorMessage}
            />
            <hr/>

            {/* Model Training Setup */}
            <ModelTrainingSetup
                experimentName={experimentName}
                experimentNameError={experimentNameError}
                setExperimentName={setExperimentName}
                executionLoading={executionLoading}
                ignorePrevious={ignorePrevious}
                model={model}
                setModel={setModel}
                models={models}
                availableConfigurations={availableConfigurations}
                chosenConfiguration={chosenConfiguration}
                setChosenConfiguration={setChosenConfiguration}
                setIgnorePrevious={setIgnorePrevious}
            />
            <hr/>

            {/* Model Evaluation Setup */}
            <ModelEvaluationSetup
                forecastHorizon={forecastHorizon}
                executionLoading={executionLoading}
                setForecastHorizon={setForecastHorizon}
            />
            <hr/>

            {/* Experiment Execution */}
            <ExperimentExecution
                executionLoading={executionLoading}
                uploadSuccess={uploadSuccess}
                experimentResolution={experimentResolution}
                dateVal={dateVal}
                dateTest={dateTest}
                dateEnd={dateEnd}
                experimentName={experimentName}
                model={model}
                chosenConfiguration={chosenConfiguration}
                forecastHorizon={forecastHorizon}
                executionInitiated={executionInitiated}
                setExecutionLoading={setExecutionLoading}
                setExecutionInitiated={setExecutionInitiated}
                setExecutionSuccess={setExecutionSuccess}
                setExecutionFailure={setExecutionFailure}
                availableConfigurations={availableConfigurations}
                ignorePrevious={ignorePrevious}
                seriesUri={seriesUri}
            />
        </React.Fragment>}

        {loading && <FullPageLoading/>}
        <Snackbar open={newFileSuccess} autoHideDuration={3000} onClose={closeSnackbar}>
            <AlertCustom onClose={closeSnackbar} severity="success" sx={{width: '100%', mb: 5}}>
                The new file has been successfully uploaded!
            </AlertCustom>
        </Snackbar>
        <Snackbar open={newFileFailure} autoHideDuration={3000} onClose={closeSnackbar}>
            <AlertCustom onClose={closeSnackbar} severity="error" sx={{width: '100%', mb: 5}}>
                {errorMessage}
            </AlertCustom>
        </Snackbar>

        <Snackbar open={executionSuccess} autoHideDuration={3000} onClose={closeSnackbar}>
            <AlertCustom onClose={closeSnackbar} severity="success" sx={{width: '100%', mb: 5}}>
                Execution initiated!
            </AlertCustom>
        </Snackbar>
        <Snackbar open={executionFailure} autoHideDuration={3000} onClose={closeSnackbar}>
            <AlertCustom onClose={closeSnackbar} severity="error" sx={{width: '100%', mb: 5}}>
                Something went wrong with the execution! Please try again!
            </AlertCustom>
        </Snackbar>
    </div>);
}

export default LoadForecast;