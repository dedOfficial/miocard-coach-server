import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { ExportToCsv } from 'export-to-csv';
import { DataExportStatsExcel } from './helpers/types';
import { CheckinTranscript } from '../export/helpers/constants';
import { sortFunction, sortFunctionCardio } from '../pdf/helpers';

@Injectable()
export class ExcelService {
  exportStatsExcel(id, data) {
    const {
      food,
      cardio,
      drug,
      symptom,
      weight,
      mood,
      walkedDistance,
      habit,
      checkin,
      recommendations,
    }: DataExportStatsExcel = data;

    const generationDate = moment()
      .format('MMMM Do YYYY, h:mm:ss a')
      .toString();

    const recommendationsSorted = recommendations.sort(sortFunction);

    const recommendationsData = recommendationsSorted.map(
      ({ day, recommendationId, isReceived, notReceivedReason }) => ({
        day: moment(day, 'DD-MM-YYYY').format('LL'),
        food,
        received: String(isReceived).toLowerCase(),
        'not received reason': notReceivedReason || '',
      }),
    );

    const foodSorted = food.sort(sortFunction);

    const foodData = foodSorted.map(
      ({ day, food, isReceived, notReceivedReason }) => ({
        day: moment(day, 'DD-MM-YYYY').format('LL'),
        food,
        received: String(isReceived).toLowerCase(),
        'not received reason': notReceivedReason || '',
      }),
    );

    const cardioSorted = cardio.sort(sortFunctionCardio);

    const cardioData = cardioSorted.map(
      ({ day, pulse, pressure, timeOfDay, isReceived, notReceivedReason }) => ({
        day: moment(day, 'DD-MM-YYYY').format('LL'),
        'time of the day': isReceived ? timeOfDay : '',
        pressure: isReceived ? pressure : '',
        pulse: isReceived ? pulse : '',
        received: String(isReceived).toLowerCase(),
        'not received reason': notReceivedReason || '',
      }),
    );

    const drugSorted = drug.sort(sortFunction);

    const drugData = drugSorted.map(
      ({ day, drug, isReceived, notReceivedReason }) => ({
        day: moment(day, 'DD-MM-YYYY').format('LL'),
        drug,
        received: String(isReceived).toLowerCase(),
        'not received reason': notReceivedReason || '',
      }),
    );

    const symptomSorted = symptom.sort(sortFunction);

    const symptomData = symptomSorted.map(
      ({ day, symptom, isReceived, notReceivedReason }) => ({
        day: moment(day, 'DD-MM-YYYY').format('LL'),
        symptom: symptom.isAbsent
          ? 'Symptoms are absent'
          : [...symptom.cardiovascular, symptom.nonCardiovascular]
              .join(', ')
              .replace(/,\s*$/, ''),
        received: String(isReceived).toLowerCase(),
        'not received reason': notReceivedReason || '',
      }),
    );

    const weightSorted = weight.sort(sortFunction);

    const weightData = weightSorted.map(
      ({ day, weight, isReceived, notReceivedReason }) => ({
        day: moment(day, 'DD-MM-YYYY').format('LL'),
        weight,
        received: String(isReceived).toLowerCase(),
        'not received reason': notReceivedReason || '',
      }),
    );

    const moodSorted = mood.sort(sortFunction);

    const moodData = moodSorted.map(
      ({ day, mood, isReceived, notReceivedReason }) => ({
        day: moment(day, 'DD-MM-YYYY').format('LL'),
        mood,
        received: String(isReceived).toLowerCase(),
        'not received reason': notReceivedReason || '',
      }),
    );

    const walkedDistanceSorted = walkedDistance.sort(sortFunction);

    const walkedDistanceData = walkedDistanceSorted.map(
      ({ day, walkedDistance, isReceived, notReceivedReason }) => ({
        day: moment(day, 'DD-MM-YYYY').format('LL'),
        'walked-distance': walkedDistance,
        received: String(isReceived).toLowerCase(),
        'not received reason': notReceivedReason || '',
      }),
    );

    const habitSorted = habit.sort(sortFunction);

    const habitData = habitSorted.map(
      ({ day, habitId, repeatability, isReceived, notReceivedReason }) => ({
        day: moment(day, 'DD-MM-YYYY').format('LL'),
        habit: habitId,
        repeatability,
        received: String(isReceived).toLowerCase(),
        'not received reason': notReceivedReason || '',
      }),
    );

    const checkinSorted = checkin.sort(sortFunction);

    const checkinData = checkinSorted.map(({ day, checkinCheckboxes }) => ({
      day: moment(day, 'DD-MM-YYYY').format('LL'),
      checkin: checkinCheckboxes
        .map((checkin) => CheckinTranscript[checkin])
        .join('; '),
    }));

    const options = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: `Stats for ${id}, generated ${generationDate}`,
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    };

    const csvExporter = new ExportToCsv(options);

    const csvFood = foodData.length && csvExporter.generateCsv(foodData, true);
    const csvDrug = drugData.length && csvExporter.generateCsv(drugData, true);
    const csvSymptom =
      symptomData.length && csvExporter.generateCsv(symptomData, true);
    const csvWeight =
      weightData.length && csvExporter.generateCsv(weightData, true);
    const csvMood = moodData.length && csvExporter.generateCsv(moodData, true);
    const csvHabit =
      habitData.length && csvExporter.generateCsv(habitData, true);
    const csvCardio =
      cardioData.length && csvExporter.generateCsv(cardioData, true);
    const csvWalkedDistance =
      walkedDistanceData.length &&
      csvExporter.generateCsv(walkedDistanceData, true);
    const csvCheckin =
      checkinData.length && csvExporter.generateCsv(checkinData, true);
    const csvRecommendation =
      recommendationsData.length &&
      csvExporter.generateCsv(recommendationsData, true);

    const stats = {
      food: csvFood,
      drug: csvDrug,
      symptom: csvSymptom,
      weight: csvWeight,
      mood: csvMood,
      'walked-distance': csvWalkedDistance,
      habit: csvHabit,
      cardio: csvCardio,
      checkin: csvCheckin,
    };

    return stats;
  }
}
